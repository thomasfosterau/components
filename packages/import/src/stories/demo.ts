/** The target, tables and callbacks the import stories share. */

import {
  importTarget,
  sourceTableFromGrid,
  type ImportSpec,
} from '@thomasfosterau/components-import';
import { text } from '@thomasfosterau/effect-document';
import * as Csv from '@thomasfosterau/effect-document/csv';
import { candidateTables, type TableRegion } from '@thomasfosterau/effect-document/schema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

/** A contact list, the example target. */
const Contact = Schema.Struct({
  name: Schema.String.annotate({ title: 'Full name', importAliases: ['contact'] }),
  email: Schema.String.check(Schema.isPattern(/@/u)).annotate({
    title: 'Email',
    description: 'Where we write to them.',
  }),
  tier: Schema.optional(Schema.Literals(['free', 'pro'])).annotate({ title: 'Plan' }),
});

/** `Contact` as an import target. */
export const contactTarget = Effect.runSync(importTarget(Contact));

/** The formats the stories accept: CSV and TSV. */
export const formats = [Csv.format, Csv.tsvFormat];

/** A CSV to try the stories with; one row's email has no `@`. */
const sampleCsv =
  'Name,E-mail,Plan,Notes\nAda Lovelace,ada@example.com,pro,first\nNia,not-an-email,free,\nLin,lin@example.com,free,\n';

/** The one table of a CSV text, as the source step hands it on. */
export const regionOf = (csv: string): TableRegion => {
  const doc = Effect.runSync(Csv.makeCsvReader().read(text(csv)));
  const [region] = candidateTables(doc);
  if (region === undefined) throw new Error('The CSV has no table.');
  return region;
};

/** The one table of `sampleCsv`. */
export const sampleRegion = regionOf(sampleCsv);

/** `sampleCsv` as a table, read with its header. */
export const sampleTable = sourceTableFromGrid(
  sampleCsv
    .trim()
    .split('\n')
    .map((line) => line.split(',')),
  { headerRow: 0, skipRows: 0 },
);

/** A spec mapping `sampleTable` onto `Contact`. */
export const sampleSpec: ImportSpec = {
  version: 1,
  source: { format: 'csv', readerOptions: {}, table: [0], headerRow: 0, skipRows: 0 },
  fields: {
    name: { kind: 'column', column: { header: 'Name', index: 0 } },
    email: { kind: 'column', column: { header: 'E-mail', index: 1 } },
    tier: { kind: 'column', column: { header: 'Plan', index: 2 } },
  },
  fingerprint: { format: 'csv', headers: ['name', 'e-mail', 'plan', 'notes'] },
};

/** Waits a moment, as posting the records to a server would. */
export const pretendToSave = (_: unknown, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 600);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
