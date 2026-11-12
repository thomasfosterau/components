/**
 * The mapping spec (`ImportSpec`, version 1): how one table of a source file
 * maps onto an import target, as a plain JSON document an app can store and
 * offer again as a preset.
 *
 * Every type here describes a JSON document, so an optional key is present or
 * absent (`Schema.optionalKey`) and never `undefined`, as in packages/charts'
 * spec types. A stored preset is decoded with {@link decodeImportSpec}, which
 * rejects unknown keys, never trusted.
 *
 * @module
 */

import * as Schema from 'effect/Schema';

/** A whole number from zero up: a row or column position, or a count. */
const Index = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/**
 * Where a table is in its document: block indexes from the top, then
 * list-item, slide, shape and table-cell indexes, and parts such as
 * `"caption"` or `"body"`.
 *
 * Structurally identical to `TableLocator` in `@thomasfosterau/effect-document`
 * (`ReadonlyArray<number | string>`, from its candidate tables, #188). It is
 * defined here until that package's 0.2.0 release, when it becomes upstream's
 * type.
 */
export const TableLocator = Schema.Array(Schema.Union([Index, Schema.String])).annotate({
  identifier: 'TableLocator',
  description: 'Where the table is in its document, as effect-document locates it.',
});
/** The decoded type of {@link TableLocator}: `ReadonlyArray<number | string>`. */
export type TableLocator = typeof TableLocator.Type;

/**
 * A source column: by its header name, with a position to fall back on.
 *
 * `{ "header": "Email", "index": 2 }` names the column headed `Email`; when no
 * header matches (the table has no header row, or the header was renamed),
 * it is the column at position 2. The position also tells duplicate headers
 * apart: when the header at `index` matches, that column wins over an earlier
 * one with the same name. `{ "index": 2 }` is a column by position alone, for
 * a table without a header row. Positions count from 0.
 */
export const ColumnRef = Schema.Union([
  Schema.Struct({ header: Schema.String, index: Schema.optionalKey(Index) }),
  Schema.Struct({ index: Index }),
]).annotate({
  identifier: 'ColumnRef',
  description: 'A source column by header name, with a position to fall back on.',
});
/** The decoded type of {@link ColumnRef}. */
export type ColumnRef = typeof ColumnRef.Type;

/**
 * How a column's text becomes the field's value.
 *
 * The names follow `CsvInferenceOptions` and `CsvScanOptions` in
 * `@thomasfosterau/effect-document`, so a CSV's reader options and a field's
 * parse options read the same way: `trimWhitespace`, `nullValues`,
 * `booleans`, `booleansCaseSensitive`, `decimalChar`, `groupChar` and
 * `percent` mean what they mean there. `datePatterns` is this package's own.
 *
 * `applyMapping` honours `trimWhitespace` and `nullValues` today. The others
 * are part of version 1 of the format, so a stored spec that sets them
 * decodes, and are applied once the parsing transforms land.
 */
export const ParseOptions = Schema.Struct({
  /** Trim whitespace around the cell's text before anything else. Off by default. */
  trimWhitespace: Schema.optionalKey(Schema.Boolean),
  /**
   * Texts that mean the cell is empty, matched exactly after trimming: such a
   * cell maps to no value. Defaults to `[""]`.
   */
  nullValues: Schema.optionalKey(Schema.Array(Schema.String)),
  /** The spellings of true and false, or `false` for none. Defaults to `["true", "false"]`. */
  booleans: Schema.optionalKey(
    Schema.Union([Schema.Tuple([Schema.String, Schema.String]), Schema.Literal(false)]),
  ),
  /** Match `booleans` case-sensitively. Off by default. */
  booleansCaseSensitive: Schema.optionalKey(Schema.Boolean),
  /** The decimal separator of numbers. Defaults to `"."`. */
  decimalChar: Schema.optionalKey(Schema.String),
  /** The digit-group separator of numbers, such as `","` for `1,234.56`. None by default. */
  groupChar: Schema.optionalKey(Schema.String),
  /** Read a trailing `%` as a percentage: `12%` becomes 0.12. Off by default. */
  percent: Schema.optionalKey(Schema.Boolean),
  /** Date patterns to try in order, in a small documented token set. */
  datePatterns: Schema.optionalKey(Schema.Array(Schema.String)),
}).annotate({
  identifier: 'ParseOptions',
  description: "How a column's text becomes the field's value.",
});
/** The decoded type of {@link ParseOptions}. */
export type ParseOptions = typeof ParseOptions.Type;

/** The field takes one column's value. */
export const ColumnMapping = Schema.Struct({
  kind: Schema.Literal('column'),
  column: ColumnRef,
  parse: Schema.optionalKey(ParseOptions),
});
/** The decoded type of {@link ColumnMapping}. */
export type ColumnMapping = typeof ColumnMapping.Type;

/** The field takes the same value on every row. */
export const ConstantMapping = Schema.Struct({
  kind: Schema.Literal('constant'),
  value: Schema.Json,
});
/** The decoded type of {@link ConstantMapping}. */
export type ConstantMapping = typeof ConstantMapping.Type;

/** The field is several columns joined by a template, such as `"{0} {1}"`. */
export const TemplateMapping = Schema.Struct({
  kind: Schema.Literal('template'),
  template: Schema.String,
  columns: Schema.Array(ColumnRef),
});
/** The decoded type of {@link TemplateMapping}. */
export type TemplateMapping = typeof TemplateMapping.Type;

/** The field is one part of a column split on a separator. */
export const SplitMapping = Schema.Struct({
  kind: Schema.Literal('split'),
  column: ColumnRef,
  separator: Schema.String,
  index: Index,
});
/** The decoded type of {@link SplitMapping}. */
export type SplitMapping = typeof SplitMapping.Type;

/** The field is a capture group of a regular expression over a column. */
export const RegexMapping = Schema.Struct({
  kind: Schema.Literal('regex'),
  column: ColumnRef,
  pattern: Schema.String,
  group: Index,
});
/** The decoded type of {@link RegexMapping}. */
export type RegexMapping = typeof RegexMapping.Type;

/**
 * The field is a column's value looked up in a map. `otherwise` says what an
 * unmapped value does: `"error"` (an issue), `"undefined"` (no value) or
 * `"keep"` (the value as it is).
 */
export const ValueMapMapping = Schema.Struct({
  kind: Schema.Literal('valueMap'),
  column: ColumnRef,
  map: Schema.Record(Schema.String, Schema.Json),
  otherwise: Schema.optionalKey(Schema.Literals(['error', 'undefined', 'keep'])),
});
/** The decoded type of {@link ValueMapMapping}. */
export type ValueMapMapping = typeof ValueMapMapping.Type;

/** The field is the result of an app-registered transform, named here. */
export const CustomMapping = Schema.Struct({
  kind: Schema.Literal('custom'),
  name: Schema.String,
  columns: Schema.Array(ColumnRef),
  args: Schema.optionalKey(Schema.Json),
});
/** The decoded type of {@link CustomMapping}. */
export type CustomMapping = typeof CustomMapping.Type;

/** The field takes no value from the source. */
export const SkipMapping = Schema.Struct({
  kind: Schema.Literal('skip'),
});
/** The decoded type of {@link SkipMapping}. */
export type SkipMapping = typeof SkipMapping.Type;

/** How one target field gets its value, told apart by `kind`. */
export const FieldMapping = Schema.Union([
  ColumnMapping,
  ConstantMapping,
  TemplateMapping,
  SplitMapping,
  RegexMapping,
  ValueMapMapping,
  CustomMapping,
  SkipMapping,
])
  .annotate({ identifier: 'FieldMapping', description: 'How one target field gets its value.' })
  .pipe(Schema.toTaggedUnion('kind'));
/** The decoded type of {@link FieldMapping}. */
export type FieldMapping = typeof FieldMapping.Type;

/** Which table of which file, and how it is read. */
export const ImportSource = Schema.Struct({
  /** The reader's `Format.id`, such as `"csv"`. */
  format: Schema.String,
  /** The text encoding the file was read with, when the format has one. */
  encoding: Schema.optionalKey(Schema.String),
  /** The reader's own options, such as a `CsvReaderOptions`; its format defines them. */
  readerOptions: Schema.Unknown,
  table: TableLocator,
  /**
   * The header row's position among the rows `skipRows` keeps (0 is the first
   * of them). Absent: the table has no header row.
   */
  headerRow: Schema.optionalKey(Index),
  /** Rows dropped from the top of the table before anything else. */
  skipRows: Index,
});
/** The decoded type of {@link ImportSource}. */
export type ImportSource = typeof ImportSource.Type;

/** What identifies a source for preset matching: its format and normalised header names. */
export const SourceFingerprint = Schema.Struct({
  format: Schema.String,
  headers: Schema.Array(Schema.String),
});
/** The decoded type of {@link SourceFingerprint}. */
export type SourceFingerprint = typeof SourceFingerprint.Type;

/**
 * A mapping spec, version 1: the source table, one {@link FieldMapping} per
 * target field (keyed by the field's key), and the source's fingerprint.
 */
export const ImportSpec = Schema.Struct({
  version: Schema.Literal(1),
  source: ImportSource,
  fields: Schema.Record(Schema.String, FieldMapping),
  fingerprint: SourceFingerprint,
}).annotate({
  identifier: 'ImportSpec',
  description: 'How one table of a source file maps onto an import target (version 1).',
});
/** The decoded type of {@link ImportSpec}. */
export type ImportSpec = typeof ImportSpec.Type;

const decodeStrict = Schema.decodeUnknownEffect(ImportSpec, {
  onExcessProperty: 'error',
  errors: 'all',
});

/**
 * Decodes a stored spec, such as a preset loaded from the app's storage:
 * strictly, so an unknown key anywhere fails rather than being dropped, with
 * every issue collected. A preset is a JSON document, hence the `Json` input:
 * parse the stored text first (or decode it with
 * `Schema.fromJsonString(ImportSpec)` under the same options).
 */
export const decodeImportSpec = (document: Schema.Json) => decodeStrict(document);
