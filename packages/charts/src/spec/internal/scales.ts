import { Schema } from 'effect';

/** A domain entry: a number (quantitative), ISO string (temporal), or category value. */
const DomainValue = Schema.Union([Schema.Finite, Schema.String]).annotate({
  identifier: 'DomainValue',
  description:
    'A domain entry: a number for quantitative, an ISO 8601 string for temporal, ' +
    'or a category value for ordinal/nominal.',
});

/** Optional per-scale hints. Interpreters may infer or override these. */
export const ScaleHint = Schema.Struct({
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
