import { Schema } from 'effect';

/**
 * Web-only, non-portable hints (e.g. preferred renderer, interaction
 * descriptors). Native interpreters ignore this entirely; web interpreters
 * must degrade gracefully when an extension is absent.
 */
export const Extensions = Schema.Record(Schema.String, Schema.Unknown).annotate({
  identifier: 'Extensions',
  description: 'Web-only, non-portable hints. Native interpreters ignore this entirely.',
});
