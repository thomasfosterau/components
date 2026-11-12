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

/** The message a rejected save carries, or `fallback` when it carries none. */
export function rejectionMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message !== '') return reason.message;
  return typeof reason === 'string' && reason !== '' ? reason : fallback;
}
