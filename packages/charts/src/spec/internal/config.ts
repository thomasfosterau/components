import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/** Portable presentation hints honoured (or gracefully ignored) by every interpreter. */
export const Config = Schema.Struct({
  title: Schema.optionalKey(Schema.String.annotate({ description: 'The chart title.' })),
  tooltip: Schema.optionalKey(
    Schema.Boolean.annotate({
      description:
        'Whether tooltips are enabled. A trivial declarative hint — ' +
        'real interaction is per-platform application code, not document data.',
    }),
  ),
}).annotate({
  identifier: 'Config',
  description: 'Portable presentation hints.',
});

/** The decoded type of {@link Config}; the public mirror is `Config` in `../types.ts`. */
export type Config = typeof Config.Type;
