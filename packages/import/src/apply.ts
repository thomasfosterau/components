/**
 * The mapping engine: a spec applied to a source table, row by row, each
 * row decoded by the target's own Schema.
 *
 * @module
 */

import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Option from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as SchemaIssue from 'effect/SchemaIssue';
import * as Str from 'effect/String';
import * as Stream from 'effect/Stream';
import { type ColumnMapping, ColumnRef, FieldMapping, type ImportSpec } from './spec.ts';
import type { SourceCell, SourceRow, SourceTable } from './table.ts';
import type { ImportTarget, TargetSchema } from './target.ts';

/** A cell of the source table: its row (`SourceRow.index`) and column position. */
export interface CellPosition {
  readonly row: number;
  readonly column: number;
}

/**
 * A user's fix to one source cell, applied before mapping, so it survives a
 * later change to the mapping. `value: undefined` empties the cell.
 */
export interface CellEdit extends CellPosition {
  readonly value: SourceCell;
}

/** Why a row did not decode: one issue with one field. */
export interface RowIssue {
  /** The target field the issue is about; none for an issue with the record as a whole. */
  readonly field: Option.Option<string>;
  /** The source cell the field was read from; none for a constant or unmapped field. */
  readonly cell: Option.Option<CellPosition>;
  readonly message: string;
}

/** One source row's outcome: the decoded record, or every issue that stopped it. */
export interface MappedRow<A> {
  /** The source row's `index`. */
  readonly row: number;
  readonly result: Result.Result<A, Arr.NonEmptyReadonlyArray<RowIssue>>;
}

/** Options for {@link applyMapping}. */
export interface ApplyMappingOptions {
  /** Cell fixes, applied to the source cells before mapping. A later edit of the same cell wins. */
  readonly edits?: ReadonlyArray<CellEdit>;
}

/** The spec names a mapping kind this version of the engine does not apply yet. */
export class UnsupportedMapping extends Schema.TaggedError<
  UnsupportedMapping,
  { readonly brand: unique symbol }
>()('UnsupportedMapping', {
  field: Schema.String,
  kind: Schema.String,
  message: Schema.String,
}) {}

/** A `column` mapping names a column the table does not have. */
export class ColumnNotFound extends Schema.TaggedError<
  ColumnNotFound,
  { readonly brand: unique symbol }
>()('ColumnNotFound', {
  field: Schema.String,
  column: ColumnRef,
  message: Schema.String,
}) {}

/** The spec maps a field the target does not have. */
export class UnknownTargetField extends Schema.TaggedError<
  UnknownTargetField,
  { readonly brand: unique symbol }
>()('UnknownTargetField', {
  field: Schema.String,
  message: Schema.String,
}) {}

/** Why a spec cannot be applied to a table at all. */
export type ApplyMappingError = UnsupportedMapping | ColumnNotFound | UnknownTargetField;

/** How one field is filled on every row. */
type FieldPlan =
  | {
      readonly key: string;
      readonly from: 'column';
      readonly column: number;
      readonly trimWhitespace: boolean;
      readonly nullValues: ReadonlyArray<string>;
    }
  | { readonly key: string; readonly from: 'constant'; readonly value: Schema.Json }
  | { readonly key: string; readonly from: 'skip' };

/** A header name as preset matching compares it: trimmed, lower-cased, inner whitespace collapsed. */
const normaliseHeader = (header: string): string =>
  Str.toLowerCase(Str.trim(header)).replace(/\s+/gu, ' ');

/** The position `ref` names in a table with these headers (see {@link ColumnRef}). */
const resolveColumn = (headers: ReadonlyArray<string>, ref: ColumnRef): Option.Option<number> => {
  const fallback = Option.fromUndefinedOr(ref.index).pipe(
    Option.filter((index) => Arr.isReadonlyArrayEmpty(headers) || index < headers.length),
  );
  if (!P.hasProperty(ref, 'header')) return fallback;
  const wanted = normaliseHeader(ref.header);
  return Option.fromUndefinedOr(ref.index).pipe(
    Option.filter((index) => headers[index] === ref.header),
    Option.orElse(() => Arr.findFirstIndex(headers, (h) => h === ref.header)),
    Option.orElse(() => Arr.findFirstIndex(headers, (h) => normaliseHeader(h) === wanted)),
    Option.orElse(() => fallback),
  );
};

const describeColumn = (ref: ColumnRef): string =>
  P.hasProperty(ref, 'header') ? `headed "${ref.header}"` : `at position ${ref.index}`;

const notYetSupported = (key: string, kind: string) =>
  Effect.fail(
    new UnsupportedMapping({
      field: key,
      kind,
      message: `The field "${key}" uses a "${kind}" mapping, which this version does not apply yet.`,
    }),
  );

/** How the spec fills one target field. */
const planField = (
  key: string,
  mapping: FieldMapping,
  headers: ReadonlyArray<string>,
): Effect.Effect<FieldPlan, UnsupportedMapping | ColumnNotFound> =>
  FieldMapping.match(mapping, {
    column: (columnMapping) =>
      Option.match(resolveColumn(headers, columnMapping.column), {
        onNone: () =>
          Effect.fail(
            new ColumnNotFound({
              field: key,
              column: columnMapping.column,
              message: `The field "${key}" is mapped to the column ${describeColumn(columnMapping.column)}, which the table does not have.`,
            }),
          ),
        onSome: (index) => Effect.succeed(columnPlan(key, index, columnMapping)),
      }),
    constant: ({ value }) => Effect.succeed<FieldPlan>({ key, from: 'constant', value }),
    skip: () => Effect.succeed<FieldPlan>({ key, from: 'skip' }),
    template: () => notYetSupported(key, 'template'),
    split: () => notYetSupported(key, 'split'),
    regex: () => notYetSupported(key, 'regex'),
    valueMap: () => notYetSupported(key, 'valueMap'),
    custom: () => notYetSupported(key, 'custom'),
  });

/** A `column` mapping's plan, its parse options resolved to their defaults. */
const columnPlan = (key: string, column: number, mapping: ColumnMapping): FieldPlan => ({
  key,
  from: 'column',
  column,
  trimWhitespace: mapping.parse?.trimWhitespace ?? false,
  nullValues: mapping.parse?.nullValues ?? [''],
});

/** Every target field's plan, in the target's order; a field the spec leaves out is skipped. */
const planFields = <S extends TargetSchema>(
  target: ImportTarget<S>,
  spec: ImportSpec,
  headers: ReadonlyArray<string>,
): Effect.Effect<ReadonlyArray<FieldPlan>, ApplyMappingError> => {
  const keys = Arr.map(target.descriptor.fields, (field) => field.key);
  const unknown = Arr.findFirst(R.keys(spec.fields), (key) => !Arr.contains(keys, key));
  return Option.match(unknown, {
    onSome: (field) =>
      Effect.fail(
        new UnknownTargetField({
          field,
          message: `The spec maps the field "${field}", which the target does not have.`,
        }),
      ),
    onNone: () =>
      Effect.forEach(
        keys,
        (key) =>
          Option.match(R.get(spec.fields, key), {
            onNone: () => Effect.succeed<FieldPlan>({ key, from: 'skip' }),
            onSome: (mapping) => planField(key, mapping, headers),
          }),
        { concurrency: 1 },
      ),
  });
};

/**
 * A cell as the StringTree codec reads it: text as written, any other value
 * in its canonical text (a `Date` as ISO 8601), none for an empty cell.
 */
const cellText = (cell: SourceCell): Option.Option<string> => {
  if (P.isString(cell)) return Option.some(cell);
  if (P.isDate(cell)) {
    return Option.some(Number.isNaN(cell.getTime()) ? 'Invalid Date' : cell.toISOString());
  }
  return Option.fromUndefinedOr(cell).pipe(Option.map(String));
};

/** A constant as the StringTree codec reads it: a scalar's text, any other JSON as it is. */
const constantInput = (value: Schema.Json): Option.Option<Schema.Json> => {
  if (P.isNumber(value) || P.isBoolean(value)) return Option.some(String(value));
  return Option.fromNullishOr(value);
};

const cellKey = (row: number, column: number): string => `${row}:${column}`;

/** The input one field takes from one row, after edits, trimming and the empty values. */
const fieldInput = (
  plan: FieldPlan,
  row: SourceRow,
  edits: HashMap.HashMap<string, SourceCell>,
): Option.Option<Schema.Json> => {
  if (plan.from === 'skip') return Option.none();
  if (plan.from === 'constant') return constantInput(plan.value);
  const cell = HashMap.get(edits, cellKey(row.index, plan.column)).pipe(
    Option.getOrElse(() => row.cells[plan.column]),
  );
  return cellText(cell).pipe(
    Option.map((text) => (plan.trimWhitespace && P.isString(cell) ? Str.trim(text) : text)),
    Option.filter((text) => !(P.isString(cell) && Arr.contains(plan.nullValues, text))),
  );
};

const formatIssue = SchemaIssue.makeFormatterStandardSchemaV1();

/** The path segment an issue starts at: the field it is about. */
const fieldOf = (path: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>) =>
  Arr.head(path).pipe(
    Option.map((segment) => (P.isObject(segment) ? segment.key : segment)),
    Option.filter(P.isString),
  );

/** A decode failure as row issues, each tied to its field and the cell that field read. */
const rowIssues = (
  issue: SchemaIssue.Issue,
  plans: ReadonlyArray<FieldPlan>,
  row: number,
): Arr.NonEmptyReadonlyArray<RowIssue> => {
  const cellOf = (field: string): Option.Option<CellPosition> =>
    Arr.findFirst(plans, (plan) => plan.key === field).pipe(
      Option.flatMap((plan) =>
        plan.from === 'column' ? Option.some({ row, column: plan.column }) : Option.none(),
      ),
    );
  const issues = Arr.map(formatIssue(issue).issues, ({ path, message }): RowIssue => {
    const field = fieldOf(path ?? []);
    return { field, cell: Option.flatMap(field, cellOf), message };
  });
  return Arr.match(issues, {
    onEmpty: () => [
      {
        field: Option.none(),
        cell: Option.none(),
        message: SchemaIssue.makeFormatterDefault()(issue),
      },
    ],
    onNonEmpty: (nonEmpty) => nonEmpty,
  });
};

/**
 * Applies `spec` to `table`, decoding each row into a record of the target.
 *
 * Every target field is filled as its {@link FieldMapping} says (a field the
 * spec leaves out is skipped): a `column` mapping reads one cell, honouring
 * its `parse.trimWhitespace` and `parse.nullValues` (a cell whose text is one
 * of them is empty, and an empty field is an absent key), a `constant` gives
 * every row the same value, and `skip` gives none. Cells go through
 * `Schema.toCodecStringTree(target.schema)`, the target's own codec over
 * text, so a text `"42"` decodes into a number field as a typed `42` does,
 * and the target's checks run as they would on any other input.
 *
 * The rows stream in table order, one {@link MappedRow} each, so a large
 * table is never decoded all at once. The stream fails before its first row
 * when the spec cannot be applied: {@link UnknownTargetField},
 * {@link ColumnNotFound}, or {@link UnsupportedMapping} for a mapping kind not
 * applied yet (`template`, `split`, `regex`, `valueMap`, `custom`), which is
 * never skipped silently.
 */
export const applyMapping = <S extends TargetSchema>(
  target: ImportTarget<S>,
  spec: ImportSpec,
  table: SourceTable,
  options?: ApplyMappingOptions,
): Stream.Stream<MappedRow<S['Type']>, ApplyMappingError, S['DecodingServices']> => {
  const decode = Schema.decodeUnknownEffect(Schema.toCodecStringTree(target.schema), {
    errors: 'all',
  });
  const edits = HashMap.fromIterable(
    Arr.map(options?.edits ?? [], (edit) => [cellKey(edit.row, edit.column), edit.value] as const),
  );
  const mapRow =
    (plans: ReadonlyArray<FieldPlan>) =>
    (row: SourceRow): Effect.Effect<MappedRow<S['Type']>, never, S['DecodingServices']> => {
      const input = R.fromEntries(
        Arr.getSomes(
          Arr.map(plans, (plan) =>
            fieldInput(plan, row, edits).pipe(Option.map((value) => [plan.key, value] as const)),
          ),
        ),
      );
      return decode(input).pipe(
        Effect.result,
        Effect.map((result) => ({
          row: row.index,
          result: Result.mapError(result, (error) => rowIssues(error.issue, plans, row.index)),
        })),
      );
    };
  return Stream.unwrap(
    Effect.map(planFields(target, spec, table.headers), (plans) =>
      Stream.fromIterable(table.rows).pipe(Stream.mapEffect(mapRow(plans))),
    ),
  );
};
