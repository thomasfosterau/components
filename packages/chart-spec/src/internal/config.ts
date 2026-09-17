import { Schema } from 'effect';

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
