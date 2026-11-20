/**
 * The pivot engine, the table layout's `headers` wiring and the
 * configurator's edits, tested without the component.
 */

import { describe, expect, test } from 'vite-plus/test';
import {
  aggregate,
  compareKeys,
  dateKey,
  pivot,
  type PivotConfig,
} from '../../src/lib/data/pivot.ts';
import {
  addToZone,
  removeFromZone,
  setAggregate,
  shiftInZone,
  unplacedFields,
  type PivotField,
} from '../../src/lib/data/pivot-fields.ts';
import { parentIds, pathId, pivotLayout } from '../../src/lib/data/pivot-layout.ts';
import { harvests, type Harvest } from './fixtures/harvest.ts';

const byBedAndMonth: PivotConfig<Harvest> = {
  rows: ['bed', 'crop'],
  columns: ['date'],
  values: [{ field: 'kg', agg: 'sum' }],
  dateGrouping: { date: 'month' },
};

describe('pivot', () => {
  test('groups both axes in natural order and sums every level', () => {
    const result = pivot(harvests, byBedAndMonth);
    expect(result.rows.map((group) => group.key)).toEqual(['Bed 1', 'Bed 2', 'Bed 10']);
    expect(result.rows[0]?.children.map((group) => group.key)).toEqual(['Basil', 'Tomato']);
    expect(result.columns.map((group) => group.key)).toEqual(['2026-01', '2026-02']);
    expect(result.cell(['Bed 1', 'Tomato'], ['2026-01'], 0)).toBe(2.5);
    expect(result.cell(['Bed 1'], ['2026-02'], 0)).toBe(3);
    expect(result.cell(['Bed 1'], [], 0)).toBe(6);
    expect(result.cell([], ['2026-02'], 0)).toBe(13);
    expect(result.cell([], [], 0)).toBe(16);
    expect(result.cell(['Bed 2'], ['2026-01'], 0)).toBeUndefined();
  });

  test('a bed with only a missing weight sums to 0 but has no mean', () => {
    const result = pivot(harvests, {
      rows: ['bed'],
      columns: [],
      values: [
        { field: 'kg', agg: 'sum' },
        { field: 'kg', agg: 'mean' },
        { field: 'kg', agg: 'count' },
      ],
    });
    expect(result.cell(['Bed 10'], [], 0)).toBe(0);
    expect(result.cell(['Bed 10'], [], 1)).toBeUndefined();
    expect(result.cell(['Bed 10'], [], 2)).toBe(1);
  });

  test('filters keep only the listed values', () => {
    const result = pivot(harvests, { ...byBedAndMonth, filters: { crop: ['Tomato'] } });
    expect(result.cell([], [], 0)).toBe(9.5);
    expect(result.rows.map((group) => group.key)).toEqual(['Bed 1', 'Bed 2']);
  });

  test('aggregates', () => {
    const values = [3, '1', null, 4, 'x', 2];
    expect(aggregate('sum', values)).toBe(10);
    expect(aggregate('count', values)).toBe(6);
    expect(aggregate('countDistinct', ['a', 'b', 'a'])).toBe(2);
    expect(aggregate('mean', values)).toBe(2.5);
    expect(aggregate('median', values)).toBe(2.5);
    expect(aggregate('median', [5, 1, 3])).toBe(3);
    expect(aggregate('min', values)).toBe(1);
    expect(aggregate('max', values)).toBe(4);
    expect(aggregate('max', [])).toBeUndefined();
    expect(aggregate((all) => all.length * 10, [1, 2])).toBe(20);
  });

  test('dateKey buckets dates and strings, and blanks what it cannot read', () => {
    const date = new Date('2026-03-04T10:00:00Z');
    expect(dateKey(date, 'year')).toBe('2026');
    expect(dateKey(date, 'quarter')).toBe('2026-Q1');
    expect(dateKey(date, 'month')).toBe('2026-03');
    expect(dateKey('2026-01-01', 'week')).toBe('2026-W01');
    expect(dateKey('2027-01-01', 'week')).toBe('2026-W53');
    expect(dateKey(date, 'day')).toBe('2026-03-04');
    expect(dateKey('not a date', 'day')).toBe('');
    expect(dateKey(42, 'day')).toBe('');
  });

  test('compareKeys orders numbers naturally and the blank key last', () => {
    expect(['10', '', '9', 'b', 'A'].toSorted(compareKeys)).toEqual(['9', '10', 'A', 'b', '']);
  });
});

describe('pivotLayout', () => {
  const result = pivot(harvests, byBedAndMonth);
  const options = {
    idPrefix: 'p',
    rowFields: 2,
    columnFields: 1,
    values: 1,
    expanded: new Set(parentIds(result.rows)),
    subtotals: true,
    grandTotals: true,
  };

  test('every data cell names its row groups, column group and measure', () => {
    const layout = pivotLayout(result, options);
    const tomato = layout.body.find((row) => row.group?.key === 'Tomato');
    const bed = `p-r${pathId(['Bed 1'])}`;
    const crop = `p-r${pathId(['Bed 1', 'Tomato'])}`;
    const month = `p-c${pathId(['2026-01'])}`;
    expect(tomato?.cells[0]?.headers).toBe(`${bed} ${crop} ${month} p-s${pathId(['2026-01'])}-v0`);
    expect(tomato?.cells.at(-1)?.headers).toBe(`${bed} ${crop} p-ct p-st-v0`);
    expect(layout.head).toHaveLength(2);
    expect(layout.head[0]?.map((cell) => cell.kind)).toEqual(['group', 'group', 'total']);
    expect(layout.width).toBe(3);
    expect(layout.body.at(-1)?.group).toBeUndefined();
  });

  test('a collapsed group hides its children and keeps its subtotal', () => {
    const expanded = new Set(options.expanded);
    expanded.delete(pathId(['Bed 1']));
    const layout = pivotLayout(result, { ...options, expanded });
    expect(layout.body.map((row) => row.group?.key ?? 'Total')).toEqual([
      'Bed 1',
      'Bed 2',
      'Tomato',
      'Zucchini',
      'Bed 10',
      'Basil',
      'Total',
    ]);
    expect(layout.body[0]?.cells).toHaveLength(3);
  });

  test('without subtotals an open parent has no cells; without totals no total row', () => {
    const layout = pivotLayout(result, { ...options, subtotals: false, grandTotals: false });
    expect(layout.body[0]?.cells).toEqual([]);
    expect(layout.body.at(-1)?.group?.key).toBe('Basil');
    expect(layout.width).toBe(2);
  });
});

describe('configurator edits', () => {
  const fields: PivotField<Harvest>[] = [
    { name: 'bed', label: 'Bed' },
    { name: 'crop', label: 'Crop' },
    { name: 'date', label: 'Date' },
    { name: 'kg', label: 'Weight', kind: 'measure' },
  ];

  test('a dimension moves between axes rather than sitting on both', () => {
    const next = addToZone(byBedAndMonth, { name: 'crop', label: 'Crop' }, 'columns');
    expect(next.rows).toEqual(['bed']);
    expect(next.columns).toEqual(['date', 'crop']);
  });

  test('a measure added to values sums; a dimension counts', () => {
    const none: PivotConfig<Harvest> = { rows: [], columns: [], values: [] };
    expect(addToZone(none, fields[3] ?? fields[0]!, 'values').values).toEqual([
      { field: 'kg', agg: 'sum' },
    ]);
    expect(addToZone(none, { name: 'crop', label: 'Crop' }, 'values').values).toEqual([
      { field: 'crop', agg: 'count' },
    ]);
  });

  test('shift, remove and setAggregate return new configs', () => {
    expect(shiftInZone(byBedAndMonth, 'rows', 0, 1).rows).toEqual(['crop', 'bed']);
    expect(shiftInZone(byBedAndMonth, 'rows', 0, -1).rows).toEqual(['bed', 'crop']);
    expect(removeFromZone(byBedAndMonth, 'rows', 1).rows).toEqual(['bed']);
    expect(removeFromZone(byBedAndMonth, 'values', 0).values).toEqual([]);
    expect(setAggregate(byBedAndMonth, 0, 'max').values[0]?.agg).toBe('max');
    expect(byBedAndMonth.rows).toEqual(['bed', 'crop']);
  });

  test('unplacedFields lists fields in no zone', () => {
    expect(unplacedFields(byBedAndMonth, fields)).toEqual([]);
    expect(unplacedFields({ ...byBedAndMonth, rows: ['bed'] }, fields).map((f) => f.name)).toEqual([
      'crop',
    ]);
  });
});
