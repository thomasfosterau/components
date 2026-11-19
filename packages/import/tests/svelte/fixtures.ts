/** The target, files and formats the UI suites share. */

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
