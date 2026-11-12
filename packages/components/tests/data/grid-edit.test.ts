/**
 * The edit bookkeeping an editing `DataGrid` is built on, tested without
 * the component.
 */

import { CalendarDate } from '@internationalized/date';
import { expect, test } from 'vite-plus/test';
import {
  cellErrors,
  cellKey,
  currentValue,
  editorText,
  formatCellValue,
  isCellEditable,
  rejectionMessage,
  sameCellValue,
  withChange,
  type CellLookup,
} from '../../src/lib/data/grid-edit.ts';
import type { CellChange, TableColumn } from '../../src/lib/data/table-types.ts';

interface Item {
  readonly id: string;
  readonly price: number;
}

const price: TableColumn<Item> = {
  key: 'price',
  header: 'Price',
  value: (item) => item.price,
  editable: (item) => item.id !== 'locked',
  editor: 'number',
  validate: (value) => (typeof value === 'number' && value < 0 ? ['Too low.'] : []),
};

const change = (to: unknown, from: unknown = 5): CellChange<Item> => ({
  rowKey: 'a',
  column: 'price',
  row: { id: 'a', price: 5 },
  from,
  to,
});

test('a cell is editable only in an editing grid, by flag or per row', () => {
  expect(isCellEditable(price, { id: 'a', price: 1 }, 'cell')).toBe(true);
  expect(isCellEditable(price, { id: 'locked', price: 1 }, 'cell')).toBe(false);
  expect(isCellEditable(price, { id: 'a', price: 1 }, 'none')).toBe(false);
  expect(isCellEditable({ ...price, editable: undefined }, { id: 'a', price: 1 }, 'batch')).toBe(
    false,
  );
});

test('dates compare by value, everything else by identity', () => {
  expect(sameCellValue(new CalendarDate(2026, 3, 1), new CalendarDate(2026, 3, 1))).toBe(true);
  expect(sameCellValue(new CalendarDate(2026, 3, 1), new CalendarDate(2026, 3, 2))).toBe(false);
  expect(sameCellValue(Number.NaN, Number.NaN)).toBe(true);
  expect(sameCellValue({}, {})).toBe(false);
});

test('withChange keeps one entry per cell, its first `from`, and drops a revert', () => {
  const first = withChange([], change(6));
  expect(first).toEqual([change(6)]);
  const second = withChange(first, change(7, 6));
  expect(second).toEqual([change(7, 5)]);
  expect(withChange(second, change(5, 7))).toEqual([]);
});

test('formats an edited value by the column, else by its type', () => {
  expect(formatCellValue(price, 1234.5, 'en-AU')).toBe('1,234.5');
  const dollars: TableColumn<Item> = { ...price, format: (value) => `$${JSON.stringify(value)}` };
  expect(formatCellValue(dollars, 3, 'en-AU')).toBe('$3');
  const kind: TableColumn<Item> = {
    key: 'kind',
    header: 'Kind',
    value: () => '',
    editor: 'select',
    options: [{ value: 'h', label: 'Herb' }, 'Bulb'],
  };
  expect(formatCellValue(kind, 'h', 'en')).toBe('Herb');
  expect(formatCellValue(kind, 'Bulb', 'en')).toBe('Bulb');
  expect(formatCellValue(kind, undefined, 'en')).toBe('');
  expect(formatCellValue(price, new CalendarDate(2026, 3, 1), 'en-AU')).toBe('1 Mar 2026');
  expect(editorText(price, 12)).toBe('12');
  expect(editorText(price, null)).toBe('');
  expect(editorText({ ...price, format: () => 'twelve' }, 12)).toBe('twelve');
});

test('cellErrors validates current values and adds failed saves', () => {
  const basil = { id: 'a', price: 5 };
  const rows: Item[] = [basil, { id: 'b', price: -1 }];
  const overrides = new Map<string, unknown>([[cellKey('a', 'price'), -3]]);
  const lookup: CellLookup<Item> = { rowKey: (item) => item.id, overrides };
  expect(currentValue(lookup, price, basil)).toBe(-3);
  const saveErrors = new Map([[cellKey('b', 'price'), 'Offline.']]);
  expect(cellErrors(rows, [price], lookup, saveErrors).map((error) => error.message)).toEqual([
    'Too low.',
    'Too low. Offline.',
  ]);
});

test('a rejection’s message, or the fallback', () => {
  expect(rejectionMessage(new Error('Nope'), 'Failed')).toBe('Nope');
  expect(rejectionMessage('Offline', 'Failed')).toBe('Offline');
  expect(rejectionMessage(undefined, 'Failed')).toBe('Failed');
  expect(rejectionMessage(new Error(''), 'Failed')).toBe('Failed');
});
