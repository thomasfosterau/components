/**
 * Column suggestions: which source column each target field most likely
 * reads, so a UI can pre-fill its field map, and the source fingerprint a
 * spec carries for preset matching.
 *
 * @module
 */

import * as Arr from 'effect/Array';
import * as Option from 'effect/Option';
import * as Str from 'effect/String';
import type { ColumnRef, SourceFingerprint } from './spec.ts';
import { normaliseHeader, type SourceTable } from './table.ts';
import type { FieldDescriptor, ImportTarget, TargetSchema } from './target.ts';

/**
 * Why a column was suggested for a field, strongest first:
 *
 * - `key`: the header is the field's key, exactly;
 * - `title`: the header is the field's title, exactly;
 * - `alias`: the header is one of the field's `importAliases`, compared as
 *   preset matching compares headers (trimmed, lower-cased, inner
 *   whitespace collapsed);
 * - `fuzzy`: the header and the key, title or an alias have the same
 *   letters and digits, ignoring case, spacing and punctuation
 *   (`"E-mail"` and `email`, `"first_name"` and `"First name"`).
 */
export type MatchSignal = 'key' | 'title' | 'alias' | 'fuzzy';

/** A suggested column for one target field. */
export interface ColumnSuggestion {
  /** The target field's key. */
  readonly field: string;
  /** The column, by header name with its position to fall back on. */
  readonly column: ColumnRef;
  readonly signal: MatchSignal;
  /** From 0 to 1, by signal: `key` 1, `title` 0.95, `alias` 0.8, `fuzzy` 0.6. */
  readonly confidence: number;
}

const confidences: Record<MatchSignal, number> = {
  key: 1,
  title: 0.95,
  alias: 0.8,
  fuzzy: 0.6,
};

/** A name's letters and digits, lower-cased: what a `fuzzy` match compares. */
const compact = (name: string): string => Str.toLowerCase(name).replace(/[^\p{L}\p{N}]+/gu, '');

/** The names a field answers to: its key, its title and its aliases. */
const namesOf = (field: FieldDescriptor): ReadonlyArray<string> =>
  Arr.appendAll(field.title === undefined ? [field.key] : [field.key, field.title], [
    ...field.importAliases,
  ]);

/** The strongest signal on which `header` names `field`, if any. */
const signalOf = (field: FieldDescriptor, header: string): Option.Option<MatchSignal> => {
  if (header === field.key) return Option.some('key');
  if (header === field.title) return Option.some('title');
  const normal = normaliseHeader(header);
  if (Arr.some(field.importAliases, (alias) => normaliseHeader(alias) === normal)) {
    return Option.some('alias');
  }
  const letters = compact(header);
  return letters !== '' && Arr.some(namesOf(field), (name) => compact(name) === letters)
    ? Option.some('fuzzy')
    : Option.none();
};

/**
 * The column a {@link ColumnRef} names at `index` of `table`: by its header
 * with the position to fall back on, or by position alone when the table has
 * no header row or the column's header is empty.
 */
export const columnRef = (table: SourceTable, index: number): ColumnRef => {
  const header = table.headers[index] ?? '';
  return header === '' ? { index } : { header, index };
};

/**
 * Suggests a column for each target field the table's headers name, by the
 * strongest {@link MatchSignal} (the leftmost column among equals). A field
 * no header names has no suggestion, and a table without a header row gives
 * none. One column may be suggested for several fields, as a field map
 * allows.
 *
 * Each suggestion carries its signal and confidence, so a UI can mark it as
 * a suggestion until the user confirms it.
 */
export const suggestMapping = <S extends TargetSchema>(
  target: ImportTarget<S>,
  table: SourceTable,
): ReadonlyArray<ColumnSuggestion> =>
  Arr.flatMap(target.descriptor.fields, (field) => {
    const candidates = Arr.getSomes(
      Arr.map(table.headers, (header, index) =>
        Option.map(signalOf(field, header), (signal) => ({ index, signal })),
      ),
    );
    const best = Arr.reduce(candidates, Option.none<(typeof candidates)[number]>(), (acc, next) =>
      Option.match(acc, {
        onNone: () => Option.some(next),
        onSome: (current) =>
          confidences[next.signal] > confidences[current.signal] ? Option.some(next) : acc,
      }),
    );
    return Arr.fromOption(
      Option.map(best, ({ index, signal }): ColumnSuggestion => ({
        field: field.key,
        column: columnRef(table, index),
        signal,
        confidence: confidences[signal],
      })),
    );
  });

/**
 * The fingerprint a spec carries for preset matching: the format's id and
 * the table's header names, normalised as {@link ColumnRef} matching
 * normalises them (trimmed, lower-cased, inner whitespace collapsed).
 */
export const fingerprintOf = (format: string, table: SourceTable): SourceFingerprint => ({
  format,
  headers: Arr.map(table.headers, normaliseHeader),
});
