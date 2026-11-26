/**
 * The UI's side of the engine: each step's Effect work (detecting and
 * reading a file, building the spec, mapping every row) behind a
 * `(…, signal: AbortSignal) => Promise<T>` function, so the components hold
 * plain state and an app's UI code never runs an Effect itself.
 *
 * It reaches the headless core by the package's own name, as a consumer
 * does: `svelte-package` copies `src/svelte` alone into `dist/svelte`.
 *
 * @module
 */

import {
  applyMapping,
  type CellEdit,
  columnRef,
  fingerprintOf,
  regionRead,
  sourceTableFromRegion,
  type ColumnSuggestion,
  type FieldMapping,
  type ImportSource,
  type ImportSpec,
  type ImportTarget,
  type RowIssue,
  type SourceCell,
  type SourceRead,
  type SourceTable,
  type TargetSchema,
} from '@thomasfosterau/components-import';
import {
  bytes,
  detect,
  type Content,
  type Detectable,
  type ParseError,
} from '@thomasfosterau/effect-document';
import {
  candidateTables,
  type Document,
  type TableRegion,
} from '@thomasfosterau/effect-document/schema';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Result from 'effect/Result';
import type * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';

/**
 * A target struct whose decoding needs no Effect services, which is what the
 * UI can run on its own: every field kind the mapper supports (strings,
 * numbers, booleans, dates, literals) decodes without one.
 */
export type ServiceFreeTarget = Schema.Struct<Schema.Struct.Fields> & {
  readonly DecodingServices: never;
};

/**
 * What the mapper needs of a format: what `detect` needs (its id, sniffer,
 * extensions and MIME types) and a reader. Every effect-document `Format`
 * is one, such as `Csv.format`; the type is structural because `Format` is
 * invariant in its profiles, so a `Format<CsvFeature>` is not an
 * `ImportFormat`.
 */
export interface ImportFormat extends Detectable {
  readonly reader?:
    | { readonly read: (input: Content) => Effect.Effect<Document, ParseError> }
    | undefined;
}

/** A format `detect` found the file may be, with why. */
export interface DetectedFormat {
  readonly format: ImportFormat;
  /** From 0 to 1. */
  readonly confidence: number;
  /** The sniffer's reason, for the UI to show. */
  readonly evidence: string;
}

/** A chosen file, read: its format and its candidate tables, one of them chosen. */
export interface ImportFile {
  readonly file: File;
  /** The formats the file may be, most likely first; `format` is one of them. */
  readonly candidates: ReadonlyArray<DetectedFormat>;
  readonly format: ImportFormat;
  /** Every table in the file, in document order (one for a CSV). */
  readonly tables: ReadonlyArray<TableRegion>;
  /** The table to import, one of `tables`. */
  readonly table: TableRegion;
}

/** What the user chose for one target field: a column by position, or none. */
export interface FieldChoice {
  /** The column's position, or `undefined` for no column. */
  readonly column: number | undefined;
  /** Whether the choice is the mapper's suggestion, not yet confirmed by the user. */
  readonly suggested: boolean;
}

/** The field map's choices, keyed by target field. */
export type FieldChoices = Readonly<Record<string, FieldChoice>>;

/** A row that did not decode, and why. */
export interface InvalidRow {
  /** The source row's index. */
  readonly row: number;
  readonly issues: ReadonlyArray<RowIssue>;
}

/** Every row of a table, mapped: the records in row order, and the rows that did not decode. */
export interface MappedTable<A> {
  readonly records: ReadonlyArray<A>;
  /** The source row index of each of `records`, in the same order. */
  readonly recordRows: ReadonlyArray<number>;
  readonly invalid: ReadonlyArray<InvalidRow>;
}

/**
 * What happens to rows that do not decode: `'block'` (submitting needs none),
 * `'exclude'` (they are left out, and their row indexes passed as
 * `excluded`) or `'allow'` (they are passed on in `invalid`).
 */
export type InvalidRowPolicy = 'block' | 'exclude' | 'allow';

/** What the mapper hands the app's `onSubmit`. */
export interface ImportResult<A> {
  /** The decoded records, in row order: values of the target's Schema type. */
  readonly records: ReadonlyArray<A>;
  /** The source row indexes left out under `invalidRows: 'exclude'`; empty otherwise. */
  readonly excluded: ReadonlyArray<number>;
  /** The rows that did not decode, under `invalidRows: 'allow'`; empty otherwise. */
  readonly invalid: ReadonlyArray<InvalidRow>;
  /** The spec the rows were mapped with, for the app to store or to replay on its server. */
  readonly spec: ImportSpec;
  /** The user's cell fixes, applied before mapping. Empty until the review step lands. */
  readonly edits: ReadonlyArray<CellEdit>;
}

/** Why a step could not go on: a message for the user. */
export class StepError extends Error {
  override readonly name = 'StepError';
}

/** Runs a step's Effect as a promise, its failure's message as a {@link StepError}. */
const run = <A, E extends { readonly message: string }>(
  effect: Effect.Effect<A, E>,
  signal: AbortSignal,
): Promise<A> =>
  Effect.runPromise(effect.pipe(Effect.mapError((error) => new StepError(error.message))), {
    signal,
  });

/** The `accept` attribute for these formats: each extension with its dot. */
export const acceptOf = (formats: ReadonlyArray<ImportFormat>): string =>
  Arr.dedupe(
    Arr.flatMap(formats, (format) => Arr.map(format.extensions ?? [], (ext) => `.${ext}`)),
  ).join(',');

/**
 * The formats `file` may be, most likely first, by its bytes (its name and
 * type only break ties). Empty when none of `formats` recognises it.
 */
export const detectFile = async (
  file: File,
  formats: ReadonlyArray<ImportFormat>,
  signal: AbortSignal,
): Promise<ReadonlyArray<DetectedFormat>> => {
  const data = new Uint8Array(await file.arrayBuffer());
  return run(
    detect(bytes(data), { formats, hints: { fileName: file.name, mimeType: file.type } }),
    signal,
  );
};

/**
 * Reads `file` as `format` and lists its candidate tables. Rejects with a
 * {@link StepError} when the format has no reader or the read fails.
 */
export const readTables = async (
  file: File,
  format: ImportFormat,
  signal: AbortSignal,
): Promise<ReadonlyArray<TableRegion>> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const reading: Effect.Effect<ReadonlyArray<TableRegion>, StepError | ParseError> = Option.match(
    Option.fromUndefinedOr(format.reader),
    {
      onNone: () => Effect.fail(new StepError(`There is no reader for the format "${format.id}".`)),
      onSome: (reader) => Effect.map(reader.read(bytes(data)), candidateTables),
    },
  );
  return run(reading, signal);
};

/**
 * Where a table's header is, to start the field map with: the region's own
 * guess (`regionRead`), except that a worksheet whose first row is all
 * non-empty text is read as having a header even when no column below it is
 * typed. The reader's guess needs a typed column to tell a header from data,
 * and a CSV whose every column is text (names, emails, codes) is common;
 * the user can still turn the header off.
 */
export const defaultRead = (region: TableRegion): SourceRead => {
  const guess = regionRead(region);
  if (guess.headerRow !== undefined || !P.isTagged(region, 'WorksheetRegion')) return guess;
  const first = Arr.head(sourceTableFromRegion(region, { skipRows: 0 }).rows);
  const isHeaderLike = Option.exists(
    first,
    (row) =>
      row.index === 0 &&
      Arr.isReadonlyArrayNonEmpty(row.cells) &&
      Arr.every(row.cells, (cell) => P.isString(cell) && cell.trim() !== ''),
  );
  return isHeaderLike ? { headerRow: 0, skipRows: 0 } : guess;
};

/**
 * `read` with its header row on or off. Turned on, a header the read
 * already placed stays where it is, and otherwise it is the first row kept.
 */
export const withHeaderRow = (read: SourceRead, on: boolean): SourceRead =>
  on ? { headerRow: read.headerRow ?? 0, skipRows: read.skipRows } : { skipRows: read.skipRows };

/** `read` skipping `skipRows` rows, a whole number from 0; an empty or invalid entry is 0. */
export const withSkipRows = (read: SourceRead, skipRows: number | undefined): SourceRead => {
  const skip = Option.fromUndefinedOr(skipRows).pipe(
    Option.filter(Number.isFinite),
    Option.map((value) => Math.max(0, Math.trunc(value))),
    Option.getOrElse(() => 0),
  );
  return read.headerRow === undefined
    ? { skipRows: skip }
    : { headerRow: read.headerRow, skipRows: skip };
};

/** The choices the suggestions give, keeping every choice the user has confirmed. */
export const seedChoices = <S extends TargetSchema>(
  target: ImportTarget<S>,
  suggestions: ReadonlyArray<ColumnSuggestion>,
  previous: FieldChoices,
): FieldChoices =>
  R.fromEntries(
    Arr.map(target.descriptor.fields, (field) => {
      const kept = Option.fromUndefinedOr(previous[field.key]).pipe(
        Option.filter((choice) => !choice.suggested),
      );
      const choice = Option.getOrElse(kept, (): FieldChoice => {
        const suggestion = Arr.findFirst(suggestions, (s) => s.field === field.key);
        return Option.match(suggestion, {
          onNone: () => ({ column: undefined, suggested: false }),
          onSome: (s) => ({ column: s.column.index, suggested: true }),
        });
      });
      return [field.key, choice] as const;
    }),
  );

/** The keys of the required fields that have no column. */
export const missingRequired = <S extends TargetSchema>(
  target: ImportTarget<S>,
  choices: FieldChoices,
): ReadonlyArray<string> =>
  Arr.map(
    Arr.filter(
      target.descriptor.fields,
      (field) => field.isRequired && choices[field.key]?.column === undefined,
    ),
    (field) => field.key,
  );

/** The positions of a table this wide that no field reads, in order. */
export const unusedColumns = (width: number, choices: FieldChoices): ReadonlyArray<number> => {
  const used = Arr.map(R.values(choices), (choice) => choice.column);
  return Arr.filter(
    Array.from({ length: width }, (_, index) => index),
    (index) => !Arr.contains(used, index),
  );
};

/** A cell as the UI shows it: its text, a `Date` as ISO 8601, nothing for an empty or invalid one. */
export const cellDisplay = (cell: SourceCell): string => {
  if (P.isDate(cell)) return Number.isNaN(cell.getTime()) ? '' : cell.toISOString();
  return cell === undefined ? '' : String(cell);
};

/** How many columns the table has: its header's width, or its widest row. */
export const columnCount = (table: SourceTable): number =>
  Arr.reduce(table.rows, table.headers.length, (widest, row) => Math.max(widest, row.cells.length));

/** The spec's `source`: the file's format and table, and how it is read. */
const sourceOf = (source: ImportFile, read: SourceRead): ImportSource => {
  const base = {
    format: source.format.id,
    readerOptions: {},
    table: source.table.locator,
    skipRows: read.skipRows,
  };
  return read.headerRow === undefined ? base : { ...base, headerRow: read.headerRow };
};

/** The spec for a file, its read and the field choices. */
export const specFor = (
  source: ImportFile,
  read: SourceRead,
  table: SourceTable,
  choices: FieldChoices,
): ImportSpec => ({
  version: 1,
  source: sourceOf(source, read),
  fields: R.map(choices, (choice): FieldMapping =>
    choice.column === undefined
      ? { kind: 'skip' }
      : {
          kind: 'column',
          column: columnRef(table, choice.column),
          parse: { trimWhitespace: true },
        },
  ),
  fingerprint: fingerprintOf(source.format.id, table),
});

/** How many rows {@link mapTable} maps between progress reports. */
const PROGRESS_EVERY = 250;

/**
 * Maps every row of `table` with `spec`, reporting how many rows are done
 * after each batch. Rejects with a {@link StepError} when the spec cannot be
 * applied at all.
 */
export const mapTable = <S extends ServiceFreeTarget>(
  target: ImportTarget<S>,
  spec: ImportSpec,
  table: SourceTable,
  options: { readonly signal: AbortSignal; readonly onProgress?: (done: number) => void },
): Promise<MappedTable<S['Type']>> => {
  const records: Array<S['Type']> = [];
  const recordRows: Array<number> = [];
  const invalid: Array<InvalidRow> = [];
  const mapping = applyMapping(target, spec, table).pipe(
    Stream.grouped(PROGRESS_EVERY),
    Stream.runForEach((batch) =>
      Effect.andThen(
        Effect.sync(() => {
          Arr.forEach(batch, ({ row, result }) =>
            Result.match(result, {
              onSuccess: (record) => {
                records.push(record);
                recordRows.push(row);
              },
              onFailure: (issues) => {
                invalid.push({ row, issues });
              },
            }),
          );
          options.onProgress?.(records.length + invalid.length);
        }),
        Effect.yieldNow,
      ),
    ),
    Effect.as({ records, recordRows, invalid }),
  );
  return run(mapping, options.signal);
};
