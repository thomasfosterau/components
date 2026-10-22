import * as Schema from 'effect/Schema';

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
