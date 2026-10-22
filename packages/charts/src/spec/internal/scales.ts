import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/** A domain entry: a number (quantitative), ISO string (temporal), or category value. */
const DomainValue = Schema.Union([Schema.Finite, Schema.String]).annotate({
  identifier: 'DomainValue',
  description:
    'A domain entry: a number for quantitative, an ISO 8601 string for temporal, ' +
    'or a category value for ordinal/nominal.',
});

/** Optional per-scale hints. Interpreters may infer or override these. */
const ScaleHint = Schema.Struct({
  domain: Schema.optionalKey(Schema.Array(DomainValue)),
  nice: Schema.optionalKey(
    Schema.Boolean.annotate({
      description: 'Round the domain to human-friendly values.',
    }),
  ),
  zero: Schema.optionalKey(
    Schema.Boolean.annotate({
      description: 'Force the domain to include zero.',
    }),
  ),
}).annotate({
  identifier: 'ScaleHint',
  description: 'Optional scale hints. Interpreters may infer or override these.',
});

/** Per-channel scale hints. */
export const Scales = Schema.Struct({
  x: Schema.optionalKey(ScaleHint),
  y: Schema.optionalKey(ScaleHint),
}).annotate({
  identifier: 'Scales',
  description: 'Per-channel scale hints.',
});

/** The decoded type of {@link ScaleHint}; the public mirror is `ScaleHint` in `../types.ts`. */
export type ScaleHint = typeof ScaleHint.Type;

/** The decoded type of {@link Scales}; the public mirror is `Scales` in `../types.ts`. */
export type Scales = typeof Scales.Type;
