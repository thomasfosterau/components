/** The target and spec the engine suites share. */

import * as Schema from 'effect/Schema';
import type { FieldMapping, ImportSpec } from '../src/index.ts';

/** The issue's example target (#139), less the email check's pattern detail. */
export const Contact = Schema.Struct({
  name: Schema.String.annotate({
    title: 'Full name',
    importAliases: ['name', 'contact', 'full name'],
  }),
  email: Schema.String.check(Schema.isPattern(/@/u)),
  dob: Schema.optional(Schema.Date).annotate({ title: 'Date of birth' }),
  tier: Schema.Literals(['free', 'pro']),
});
export type Contact = typeof Contact.Type;

/** A CSV spec over `fields`, with a header row and nothing skipped. */
export const specOf = (fields: Readonly<Record<string, FieldMapping>>): ImportSpec => ({
  version: 1,
  source: { format: 'csv', readerOptions: {}, table: [0], headerRow: 0, skipRows: 0 },
  fields,
  fingerprint: { format: 'csv', headers: ['name', 'email', 'dob', 'tier'] },
});
