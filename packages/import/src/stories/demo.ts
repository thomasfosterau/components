/** The target, tables and callbacks the import stories share. */

import {
  importTarget,
  sourceTableFromGrid,
  type ImportSpec,
} from '@thomasfosterau/components-import';
import { text } from '@thomasfosterau/effect-document';
import * as Csv from '@thomasfosterau/effect-document/csv';
import { Xlsx } from '@thomasfosterau/effect-document/ooxml';
import { candidateTables, type TableRegion } from '@thomasfosterau/effect-document/schema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import {
  defaultReaderChoice,
  readerOptionsOf,
  type ImportFile,
  type ImportFormat,
} from '../svelte/session.ts';

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

/** CSV with its reader factory. */
const csvWithOptions: ImportFormat = { ...Csv.format, readerWith: Csv.makeCsvReader };

/**
 * The formats with their reader factories, so the read options step offers
 * the encoding, separator, quote, ragged rows and type inference. TSV's
 * factory starts from the tab dialect, so its default separator stays a tab.
 */
export const readerFormats: readonly ImportFormat[] = [
  csvWithOptions,
  {
    ...Csv.tsvFormat,
    readerWith: (options: Csv.CsvReaderOptions) =>
      Csv.makeCsvReader({ dialect: Csv.TsvDialect, ...options }),
  },
];

/** The formats with Excel workbooks too, for a story that takes a sheet of one. */
export const workbookFormats = [...formats, Xlsx.format];

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

/** A CSV whose table starts under a title line, for the read options. */
export const titledRegion = regionOf(
  'Contacts exported on 1 May,,\nName,E-mail,Plan\nAda Lovelace,ada@example.com,pro\nLin,lin@example.com,free\n',
);

/** A CSV separated by semicolons, which a comma-separated read takes as one column. */
export const semicolonCsv =
  'Name;E-mail;Plan\nAda Lovelace;ada@example.com;pro\nLin;lin@example.com;free\n';

/** A CSV under a title line narrower than its table, which only a ragged read takes. */
export const titledCsv =
  'Contacts exported on 1 May\nName,E-mail,Plan\nAda Lovelace,ada@example.com,pro\nLin,lin@example.com,free\n';

/**
 * A CSV text as the source step hands it on, read as `format` with the
 * default reader choice: the file, and its one table.
 */
export const sourceOf = (
  name: string,
  csv: string,
  format: ImportFormat = csvWithOptions,
): ImportFile => {
  const reader = format.readerWith?.(readerOptionsOf(defaultReaderChoice)) ?? format.reader;
  if (reader === undefined) throw new Error('The format has no reader.');
  const doc = Effect.runSync(reader.read(text(csv)));
  const [table] = candidateTables(doc);
  if (table === undefined) throw new Error('The CSV has no table.');
  const candidates = [{ format, confidence: 1, evidence: 'A CSV' }];
  return {
    file: new File([csv], name, { type: 'text/csv' }),
    candidates,
    format,
    tables: [table],
    table,
    reader: format.readerWith === undefined ? undefined : defaultReaderChoice,
    encoding: format.readerWith === undefined ? undefined : 'UTF-8',
  };
};

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
