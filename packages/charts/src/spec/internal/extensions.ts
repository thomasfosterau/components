import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/**
 * Web-only, non-portable hints (e.g. preferred renderer, interaction
 * descriptors). Native interpreters ignore this entirely; web interpreters
 * must degrade gracefully when an extension is absent.
 */
export const Extensions = Schema.Record(Schema.String, Schema.Unknown).annotate({
  identifier: 'Extensions',
  description: 'Web-only, non-portable hints. Native interpreters ignore this entirely.',
});

/** The decoded type of {@link Extensions}; the public mirror is `Extensions` in `../types.ts`. */
export type Extensions = typeof Extensions.Type;
