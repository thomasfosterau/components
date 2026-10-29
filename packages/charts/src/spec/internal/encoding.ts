import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/**
 * The declared type of an encoded field (the Vega-Lite model).
 *
 * Explicit types are non-negotiable: JSON has no dates and no ordering, so
 * every interpreter (TS, Swift, Kotlin) reconstructs typed plottable values
 * from these declarations — never by sniffing JSON runtime values.
 */
const FieldType = Schema.Literals(['quantitative', 'ordinal', 'nominal', 'temporal']).annotate({
  identifier: 'FieldType',
  description:
    'The declared type of an encoded field. Interpreters reconstruct typed values ' +
    'from this declaration, never by sniffing JSON values.',
});

/** A mapping from a data field to a visual channel, with an explicit type. */
const Channel = Schema.Struct({
  field: Schema.String.annotate({
    description: 'The name of the field in each datum that this channel reads.',
  }),
  type: FieldType,
}).annotate({
  identifier: 'Channel',
  description: 'A field-to-channel mapping with an explicit declared type.',
});

/** Field-to-channel mappings. */
export const Encoding = Schema.Struct({
  x: Schema.optionalKey(Channel),
  y: Schema.optionalKey(Channel),
  x2: Schema.optionalKey(
    Channel.annotate({
      description:
        'Spec 1.1: the end of a range on x. With mark "bar", each bar spans x to x2. Same type as x, quantitative or temporal.',
    }),
  ),
  y2: Schema.optionalKey(
    Channel.annotate({
      description:
        'Spec 1.1: the end of a range on y. With mark "bar", each bar spans y to y2. Same type as y, quantitative or temporal.',
    }),
  ),
  id: Schema.optionalKey(
    Channel.annotate({
      description: 'Spec 1.1, mark "tree": the field naming each row; ids are unique.',
    }),
  ),
  parent: Schema.optionalKey(
    Channel.annotate({
      description:
        'Spec 1.1, mark "tree": the field holding the parent row\'s id; null (or absent) for a root.',
    }),
  ),
  label: Schema.optionalKey(
    Channel.annotate({
      description: 'Spec 1.1, mark "tree": the text of each node; defaults to its id.',
    }),
  ),
  color: Schema.optionalKey(Channel),
  size: Schema.optionalKey(Channel),
  opacity: Schema.optionalKey(Channel),
}).annotate({
  identifier: 'Encoding',
  description: 'Field-to-channel mappings describing how data maps to visual channels.',
});

/** The decoded type of {@link FieldType}; the public mirror is `FieldType` in `../types.ts`. */
export type FieldType = typeof FieldType.Type;

/** The decoded type of {@link Channel}; the public mirror is `Channel` in `../types.ts`. */
export type Channel = typeof Channel.Type;

/** The decoded type of {@link Encoding}; the public mirror is `Encoding` in `../types.ts`. */
export type Encoding = typeof Encoding.Type;
