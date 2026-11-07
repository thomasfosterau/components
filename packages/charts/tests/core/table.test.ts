/**
 * The data-table text alternative (#304): headers from the channel fields,
 * cells formatted by declared type, a range as "start to end", and a tree's
 * rows with their parents.
 */
import { describe, expect, it } from 'vite-plus/test';
import { taxonomy } from '../fixtures/taxonomy.ts';
import { buildDataTable } from '../../src/core/index.ts';
import { isInlineData, parseSpec, validateSpec, type ChartSpec } from '../../src/spec/index.ts';

/** The inline rows of a test spec. */
function valuesOf(spec: ChartSpec) {
  if (!isInlineData(spec.data)) throw new Error('expected inline data');
  return spec.data.values;
}

describe('buildDataTable', () => {
  it('has one column per channel and one row per datum, formatted by declared type', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'line',
      encoding: {
        x: { field: 'date', type: 'temporal' },
        y: { field: 'price', type: 'quantitative' },
        color: { field: 'ticker', type: 'nominal' },
      },
      data: {
        values: [
          { date: '2024-01-01', price: 100.5, ticker: 'AAPL' },
          { date: Date.UTC(2024, 0, 2, 12, 30), price: null, ticker: 'GOOG' },
        ],
      },
      config: { title: 'Prices' },
    });
    expect(buildDataTable(spec, valuesOf(spec))).toEqual({
      caption: 'Prices',
      columns: [
        { channels: ['x'], header: 'date' },
        { channels: ['y'], header: 'price' },
        { channels: ['color'], header: 'ticker' },
      ],
      rows: [
        ['2024-01-01', '100.5', 'AAPL'],
        ['2024-01-02T12:30:00.000Z', '', 'GOOG'],
      ],
    });
  });

  it('shows a range bar as one "start to end" column', () => {
    const spec = parseSpec({
      specVersion: '1.1',
      mark: 'bar',
      encoding: {
        y: { field: 'task', type: 'nominal' },
        x: { field: 'start', type: 'temporal' },
        x2: { field: 'end', type: 'temporal' },
      },
      data: { values: [{ task: 'Sow', start: '2026-09-01', end: '2026-10-15' }] },
    });
    const table = buildDataTable(spec, valuesOf(spec));
    expect(table.caption).toBeUndefined();
    expect(table.columns).toEqual([
      { channels: ['x', 'x2'], header: 'start to end' },
      { channels: ['y'], header: 'task' },
    ]);
    expect(table.rows).toEqual([['2026-09-01 to 2026-10-15', 'Sow']]);
    expect(buildDataTable(spec, valuesOf(spec), { rangeSeparator: ' – ' }).rows).toEqual([
      ['2026-09-01 – 2026-10-15', 'Sow'],
    ]);
  });

  it('leaves out a channel that repeats an earlier column', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'fruit', type: 'nominal' },
        y: { field: 'count', type: 'quantitative' },
        color: { field: 'fruit', type: 'nominal' },
      },
      data: { values: [{ fruit: 'apple', count: 3 }] },
    });
    expect(buildDataTable(spec, valuesOf(spec)).columns.map((column) => column.header)).toEqual([
      'fruit',
      'count',
    ]);
  });

  it("lists a tree's nodes with their parents, by label", () => {
    const table = buildDataTable(taxonomy, valuesOf(taxonomy));
    expect(table.columns.map((column) => column.header)).toEqual(['name', 'parent', 'status']);
    expect(table.rows.slice(0, 3)).toEqual([
      ['Solanaceae', '', 'family'],
      ['Solanum', 'Solanaceae', 'genus'],
      ['S. lycopersicum', 'Solanum', 'grown'],
    ]);
  });

  it('names a tree without labels by id', () => {
    const spec = parseSpec({
      specVersion: '1.1',
      mark: 'tree',
      encoding: {
        id: { field: 'id', type: 'nominal' },
        parent: { field: 'up', type: 'nominal' },
      },
      data: {
        values: [
          { id: 'a', up: null },
          { id: 'b', up: 'a' },
        ],
      },
    });
    const table = buildDataTable(spec, valuesOf(spec));
    expect(table.columns).toEqual([
      { channels: ['id'], header: 'id' },
      { channels: ['parent'], header: 'up' },
    ]);
    expect(table.rows).toEqual([
      ['a', ''],
      ['b', 'a'],
    ]);
  });

  it('builds a table for an unsupported mark from its known channels', () => {
    const result = validateSpec({
      specVersion: '1.2',
      mark: 'sankey',
      encoding: {
        x: { field: 'from', type: 'nominal' },
        y: { field: 'flow', type: 'quantitative' },
        weight: { field: 'flow', type: 'quantitative' },
      },
      data: { values: [{ from: 'a', flow: 2 }] },
    });
    if (result.ok || result.unsupported === undefined) throw new Error('expected unsupported');
    const { spec } = result.unsupported;
    expect(buildDataTable(spec, [{ from: 'a', flow: 2 }])).toEqual({
      caption: undefined,
      columns: [
        { channels: ['x'], header: 'from' },
        { channels: ['y'], header: 'flow' },
      ],
      rows: [['a', '2']],
    });
  });

  it('throws when a value contradicts its declared type', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: { y: { field: 'v', type: 'quantitative' } },
      data: { values: [{ v: 'many' }] },
    });
    expect(() => buildDataTable(spec, valuesOf(spec))).toThrow(TypeError);
  });
});
