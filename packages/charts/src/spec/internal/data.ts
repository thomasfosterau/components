import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/**
 * A single value inside a datum: a flat JSON primitive.
 *
 * `Schema.Finite` (not `Schema.Number`) so non-finite values (NaN, Infinity)
 * are rejected and the emitted JSON Schema is a plain `{"type": "number"}` —
 * portable data must be representable in JSON on every platform.
 */
const DatumValue = Schema.Union([
  Schema.String,
  Schema.Finite,
  Schema.Boolean,
  Schema.Null,
]).annotate({
  identifier: 'DatumValue',
  description: 'A single value inside a data row: a flat JSON primitive.',
});

/** A single data row: a flat record of JSON primitives. */
const Datum = Schema.Record(Schema.String, DatumValue).annotate({
  identifier: 'Datum',
  description: 'A single data row: a flat record of JSON primitives.',
});

/** Inline data: small datasets embedded directly in the spec. */
const InlineData = Schema.Struct({
  values: Schema.Array(Datum),
}).annotate({
  identifier: 'InlineData',
  description: 'Inline data: small datasets embedded directly in the spec.',
});

/** The kind of an external data reference. */
const DataRefKind = Schema.Literals(['query', 'node', 'url']).annotate({
  identifier: 'DataRefKind',
  description: 'The kind of external data reference: a live query, another content node, or a URL.',
});

/** A reference to an externally stored dataset, resolved by the host/interpreter. */
const DataRef = Schema.Struct({
  ref: Schema.Struct({
    kind: DataRefKind,
    id: Schema.String.annotate({
      description: 'Identifier of the referenced dataset (query id, node id, or URL).',
    }),
  }),
}).annotate({
  identifier: 'DataRef',
  description: 'A reference to an externally stored dataset, resolved by the host.',
});

/**
 * The chart's data: exactly one of inline values or an external reference.
 *
 * `oneOf` mode makes the exclusivity explicit in the emitted JSON Schema,
 * which keeps Swift/Kotlin codegen unambiguous.
 */
export const Data = Schema.Union([InlineData, DataRef], { mode: 'oneOf' }).annotate({
  identifier: 'Data',
  description: 'The chart data: exactly one of inline values or an external reference.',
});

/** The decoded type of {@link DatumValue}; the public mirror is `DatumValue` in `../types.ts`. */
export type DatumValue = typeof DatumValue.Type;

/** The decoded type of {@link Datum}; the public mirror is `Datum` in `../types.ts`. */
export type Datum = typeof Datum.Type;

/** The decoded type of {@link InlineData}; the public mirror is `InlineData` in `../types.ts`. */
export type InlineData = typeof InlineData.Type;

/** The decoded type of {@link DataRefKind}; the public mirror is `DataRefKind` in `../types.ts`. */
export type DataRefKind = typeof DataRefKind.Type;

/** The decoded type of {@link DataRef}; the public mirror is `DataRef` in `../types.ts`. */
export type DataRef = typeof DataRef.Type;

/** The decoded type of {@link Data}; the public mirror is `Data` in `../types.ts`. */
export type Data = typeof Data.Type;
