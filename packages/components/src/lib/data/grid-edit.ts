/**
 * The bookkeeping behind an editing `DataGrid`: which cells are editable,
 * what each one currently holds, the batch's change list, the cells in error
 * and how an edited value is shown. Pure functions over the column spec, so
 * `EditableGrid.svelte` holds the state and none of the rules.
 *
 * @module
 */

import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  getLocalTimeZone,
  parseDate,
} from '@internationalized/date';
import { toFieldOptions } from '../fields/field-types.ts';
import type {
  CellChange,
  CellEditor,
  CellError,
  TableColumn,
  TableEditing,
} from './table-types.ts';

/** A named editor, as opposed to a snippet. */
export type NamedCellEditor = Extract<CellEditor<unknown>, string>;

/** One cell's identity across sorts, filters and pages: its row's key and its column's. */
export const cellKey = (rowKey: string, column: string): string => JSON.stringify([rowKey, column]);

/** Whether the reader may edit this column's cell in this row. */
export function isCellEditable<T>(column: TableColumn<T>, row: T, editing: TableEditing): boolean {
  if (editing === 'none' || column.editable === undefined) return false;
  return typeof column.editable === 'function' ? column.editable(row) : column.editable;
}

/** The column's editor by name, or `undefined` for a snippet editor. */
export function namedEditor<T>(column: TableColumn<T>): NamedCellEditor | undefined {
  const editor = column.editor ?? 'text';
  return typeof editor === 'string' ? editor : undefined;
}

/** The raw value a row holds in a column, before any edit. */
export const originalValue = <T>(column: TableColumn<T>, row: T): unknown =>
  column.editValue === undefined ? column.value(row) : column.editValue(row);

const isDateValue = (value: unknown): value is CalendarDate | CalendarDateTime | ZonedDateTime =>
  value instanceof CalendarDate ||
  value instanceof CalendarDateTime ||
  value instanceof ZonedDateTime;

/**
 * Whether two cell values are the same edit — `Object.is`, except that two
 * dates are equal when they name the same day and time (they are objects).
 */
export function sameCellValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  return isDateValue(left) && isDateValue(right) && left.toString() === right.toString();
}

/**
 * `changes` with one more edit folded in: a later edit to a cell replaces
 * the earlier one but keeps its `from`, and an edit back to the original
 * value removes the cell from the list. Always a new array.
 */
export function withChange<T>(
  changes: readonly CellChange<T>[],
  change: CellChange<T>,
): CellChange<T>[] {
  const index = changes.findIndex(
    (entry) => entry.rowKey === change.rowKey && entry.column === change.column,
  );
  const earlier = changes[index];
  const from = earlier === undefined ? change.from : earlier.from;
  const rest = changes.filter((_, at) => at !== index);
  if (sameCellValue(from, change.to)) return rest;
  const next = { ...change, from };
  return index === -1 ? [...rest, next] : changes.map((entry, at) => (at === index ? next : entry));
}

/** The text an edited value is shown as: the column's `format`, else a default by editor. */
export function formatCellValue<T>(
  column: TableColumn<T>,
  value: unknown,
  locales: string | readonly string[] | undefined,
): string {
  if (column.format !== undefined) return column.format(value);
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return new Intl.NumberFormat(locales).format(value);
  if (isDateValue(value)) {
    const date = value instanceof ZonedDateTime ? value.toDate() : value.toDate(getLocalTimeZone());
    return new Intl.DateTimeFormat(locales, { dateStyle: 'medium' }).format(date);
  }
  const text = plainText(value);
  if (namedEditor(column) !== 'select') return text;
  return (
    toFieldOptions(column.options ?? []).find((option) => option.value === text)?.label ?? text
  );
}

/** What a cell holds now: an edit in flight or in the batch, else the row's own value. */
export interface CellValues {
  readonly has: (key: string) => boolean;
  readonly get: (key: string) => unknown;
}

/** How to read the current value of every cell, and the key of each. */
export interface CellLookup<T> {
  readonly rowKey: (row: T) => string;
  readonly overrides: CellValues;
}

/** A cell's current value: its override if it has one, else the row's. */
export function currentValue<T>(lookup: CellLookup<T>, column: TableColumn<T>, row: T): unknown {
  const key = cellKey(lookup.rowKey(row), column.key);
  return lookup.overrides.has(key) ? lookup.overrides.get(key) : originalValue(column, row);
}

/** Every cell in error over `rows`, with its key: failed validations, then failed saves. */
export function cellErrors<T>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
  lookup: CellLookup<T>,
  saveErrors: ReadonlyMap<string, string>,
): (CellError<T> & { readonly key: string })[] {
  const found: (CellError<T> & { readonly key: string })[] = [];
  for (const row of rows) {
    for (const column of columns) {
      const key = cellKey(lookup.rowKey(row), column.key);
      const messages = [
        ...(column.validate?.(currentValue(lookup, column, row), row) ?? []),
        ...(saveErrors.has(key) ? [saveErrors.get(key) ?? ''] : []),
      ];
      if (messages.length > 0) found.push({ key, row, column, message: messages.join(' ') });
    }
  }
  return found;
}

/** The text a `'text'` editor starts from. */
export function editorText<T>(column: TableColumn<T>, value: unknown): string {
  if (column.format !== undefined) return column.format(value);
  return plainText(value);
}

/** A value as plain text: strings as they are, numbers and booleans by `String`, else JSON. */
function plainText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
 * The text a cell is copied as: the column's `format`, a date's ISO form (so
 * a spreadsheet or another grid reads it back), else the value as plain text.
 */
export function copyText<T>(column: TableColumn<T>, value: unknown): string {
  if (column.format !== undefined) return column.format(value);
  if (isDateValue(value)) return value.toString();
  return plainText(value);
}

/** What pasting text into a cell comes to: a value to commit, or text the editor cannot take. */
export type PasteResult = { readonly ok: true; readonly value: unknown } | { readonly ok: false };

const pasted = (value: unknown): PasteResult => ({ ok: true, value });
const refused: PasteResult = { ok: false };

/** A `'select'` column's option whose value or label is `text` (labels compared without case). */
function pastedOption<T>(column: TableColumn<T>, text: string): PasteResult {
  const options = toFieldOptions(column.options ?? []);
  const lower = text.toLocaleLowerCase();
  const option =
    options.find((candidate) => candidate.value === text) ??
    options.find((candidate) => candidate.label.toLocaleLowerCase() === lower);
  return option === undefined ? refused : pasted(option.value);
}

/** A `'number'` column's value from text: empty is no value, anything not a finite number is refused. */
function pastedNumber(text: string): PasteResult {
  if (text === '') return pasted(undefined);
  const value = Number(text);
  return Number.isFinite(value) ? pasted(value) : refused;
}

/** A `'date'` column's value from an ISO date (`2026-03-14`); empty is no value. */
function pastedDate(text: string): PasteResult {
  if (text === '') return pasted(undefined);
  try {
    return pasted(parseDate(text));
  } catch {
    return refused;
  }
}

/** A `'text'` (or snippet) column's value: the text through the column's `parse`, which may throw. */
function pastedText<T>(column: TableColumn<T>, text: string): PasteResult {
  if (column.parse === undefined) return pasted(text);
  try {
    return pasted(column.parse(text));
  } catch {
    return refused;
  }
}

/**
 * Pasted text as the value a cell's editor would commit: through `parse` for
 * text, as a number, as a select option by value or label, or as an ISO date.
 * One trailing line break (what a spreadsheet adds to a copied cell) is
 * dropped; text that still spans cells (a tab or a line break) is refused.
 * `undefined` when the cell takes no pasting at all: a checkbox, or a
 * snippet editor without a `parse`.
 */
export function pastedValue<T>(column: TableColumn<T>, input: string): PasteResult | undefined {
  const kind = namedEditor(column);
  if (kind === 'checkbox' || (kind === undefined && column.parse === undefined)) return undefined;
  const text = input.replace(/\r?\n$/, '');
  if (/[\t\r\n]/.test(text)) return refused;
  if (kind === 'number') return pastedNumber(text.trim());
  if (kind === 'select') return pastedOption(column, text.trim());
  if (kind === 'date') return pastedDate(text.trim());
  return pastedText(column, text);
}

/**
 * Clipboard text as rows of cells: lines split on line breaks and cells on
 * tabs, the way a spreadsheet writes a copied block (one trailing line break
 * dropped). Quoted cells holding tabs or line breaks are not unquoted.
 */
export function clipboardTable(text: string): string[][] {
  const lines = text.replace(/\r?\n$/, '').split(/\r\n|\n|\r/);
  return lines.map((line) => line.split('\t'));
}

/** Rows of cell texts as tab-separated lines, for a copied range. */
export const tableText = (rows: readonly (readonly string[])[]): string =>
  rows.map((cells) => cells.join('\t')).join('\n');

/** The message a rejected save carries, or `fallback` when it carries none. */
export function rejectionMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message !== '') return reason.message;
  return typeof reason === 'string' && reason !== '' ? reason : fallback;
}

/**
 * One undoable step: the cells a single commit changed, each with the value
 * it held just before (`from`) and the value committed (`to`). A step is a
 * list so that a commit of many cells at once (a range paste) undoes as one.
 */
export type EditStep<T> = readonly CellChange<T>[];

/** An editing grid's undo history: steps to undo, newest last, and steps to redo, newest last. */
export interface EditHistory<T> {
  readonly past: readonly EditStep<T>[];
  readonly future: readonly EditStep<T>[];
}

/** How many steps the history keeps; the oldest falls off. */
export const historyLimit = 100;

/** A history with nothing to undo or redo. */
export const emptyEditHistory = <T>(): EditHistory<T> => ({ past: [], future: [] });

/** `history` with a new step: undoable, and every step that could be redone is gone. */
export function withStep<T>(history: EditHistory<T>, step: EditStep<T>): EditHistory<T> {
  return { past: [...history.past, step].slice(-historyLimit), future: [] };
}

/** The step one undo (`'undo'`) or redo (`'redo'`) replays, and the history after it; `undefined` when there is none. */
export function travel<T>(
  history: EditHistory<T>,
  direction: 'undo' | 'redo',
): { readonly step: EditStep<T>; readonly history: EditHistory<T> } | undefined {
  const from = direction === 'undo' ? history.past : history.future;
  const step = from.at(-1);
  if (step === undefined) return undefined;
  const rest = from.slice(0, -1);
  return direction === 'undo'
    ? { step, history: { past: rest, future: [...history.future, step] } }
    : { step, history: { past: [...history.past, step], future: rest } };
}

/**
 * `history` without `step` (found by identity) — for a commit whose save was
 * rejected, so it never happened — or with it moved back onto the top of
 * `restore`, for an undo or redo whose save was rejected.
 */
export function withoutStep<T>(
  history: EditHistory<T>,
  step: EditStep<T>,
  restore?: keyof EditHistory<T>,
): EditHistory<T> {
  const past = history.past.filter((entry) => entry !== step);
  const future = history.future.filter((entry) => entry !== step);
  if (restore === 'past') return { past: [...past, step], future };
  if (restore === 'future') return { past, future: [...future, step] };
  return { past, future };
}

/**
 * `history`, or an empty one once a row it names is no longer among
 * `rowKeys`: the rows were replaced, so replaying an old edit onto them
 * would write into data the reader never edited.
 */
export function historyFor<T>(
  history: EditHistory<T>,
  rowKeys: ReadonlySet<string>,
): EditHistory<T> {
  const steps = [...history.past, ...history.future];
  if (steps.length === 0) return history;
  return steps.every((step) => step.every((change) => rowKeys.has(change.rowKey)))
    ? history
    : emptyEditHistory();
}
