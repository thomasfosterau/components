/** The target, files and formats the UI suites share. */

import { contentToBytes, document, narrow, worksheet } from '@thomasfosterau/effect-document';
import { Xlsx } from '@thomasfosterau/effect-document/ooxml';
import * as Effect from 'effect/Effect';

/**
 * The stories' target and formats: `Contact` (a full name, an email that
 * must hold an `@`, an optional plan), CSV with TSV, and a CSV text's table.
 */
export { contactTarget, formats, regionOf } from '../../src/stories/demo.ts';

/** A text file, as a user picks one. */
export const fileOf = (name: string, contents: string, type = 'text/csv'): File =>
  new File([contents], name, { type });

/** A clean CSV: every row decodes. */
export const cleanCsv = (): File =>
  fileOf(
    'contacts.csv',
    'Name,E-mail,Plan,Notes\nAda Lovelace,ada@example.com,pro,first\nLin,lin@example.com,free,\n',
  );

/** A CSV with one row the target rejects (no `@` in the email). */
export const csvWithIssues = (): File =>
  fileOf(
    'contacts.csv',
    'Name,E-mail,Plan\nAda Lovelace,ada@example.com,pro\nNia,not-an-email,free\nLin,lin@example.com,free\n',
  );

/** An Excel workbook of these sheets, each a grid of text, as a user picks one. */
export const workbookFile = async (
  name: string,
  sheets: Readonly<Record<string, ReadonlyArray<ReadonlyArray<string>>>>,
): Promise<File> => {
  const doc = document(Object.entries(sheets).map(([sheet, rows]) => worksheet(sheet, rows)));
  const writer = Xlsx.format.writer;
  if (writer === undefined) throw new Error('The XLSX format has no writer.');
  const content = await Effect.runPromise(writer.write(narrow(doc, Xlsx.profile).document));
  // A copy, so the bytes sit in a plain `ArrayBuffer`, which `BlobPart` requires.
  return new File([new Uint8Array(contentToBytes(content))], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};
