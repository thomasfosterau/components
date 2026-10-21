import { parseSpec } from '../../src/spec/index.ts';
import { describe, expect, it } from 'vitest';
import { computeContext, DEFAULT_MARGINS } from '../../src/core/index.ts';

const box = { width: 600, height: 400 };

/** Margins that make plot coordinates easy to assert: plot = 100×100. */
const square = {
  box: { width: 100, height: 100 },
  options: { margins: { top: 0, right: 0, bottom: 0, left: 0 } },
};

describe('computeContext', () => {
  it('computes dimensions with default margins', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'line',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: { values: [{ x: 0, y: 0 }] },
    });
    const context = computeContext(spec, box);
    expect(context.dimensions.outer).toEqual(box);
    expect(context.dimensions.margins).toEqual(DEFAULT_MARGINS);
    expect(context.dimensions.plot.width).toBe(600 - DEFAULT_MARGINS.left - DEFAULT_MARGINS.right);
  });

  it('uses inline data from the spec when no rows are passed', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'point',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: {
        values: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      },
    });
    const context = computeContext(spec, square.box, undefined, square.options);
    expect(context.geometry.mark).toBe('point');
    if (context.geometry.mark === 'point') {
      expect(context.geometry.points).toHaveLength(2);
    }
  });

  it('prefers passed rows over inline values', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'point',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: { values: [{ x: 0, y: 0 }] },
    });
    const rows = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const context = computeContext(spec, square.box, rows, square.options);
    if (context.geometry.mark === 'point') {
      expect(context.geometry.points).toHaveLength(3);
    }
  });

  it('throws a clear error for ref data when no rows are passed', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    expect(() => computeContext(spec, box)).toThrow(/query reference.*"sales".*host must resolve/);
  });

  it('computes context for ref data when rows are passed', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    const rows = [
      { cat: 'a', v: 1 },
      { cat: 'b', v: 2 },
    ];
    const context = computeContext(spec, box, rows);
    if (context.geometry.mark === 'bar') {
      expect(context.geometry.bars).toHaveLength(2);
    }
  });

  describe('produces complete contexts for every v1 mark', () => {
    const quantData = {
      values: [
        { x: 0, y: 0 },
        { x: 5, y: 10 },
        { x: 10, y: 5 },
      ],
    };
    const quantEncoding = {
      x: { field: 'x', type: 'quantitative' },
      y: { field: 'y', type: 'quantitative' },
    };

    it.each(['line', 'area', 'point'] as const)('%s mark', (mark) => {
      const spec = parseSpec({
        specVersion: '1',
        mark,
        encoding: quantEncoding,
        data: quantData,
      });
      const context = computeContext(spec, square.box, undefined, square.options);

      expect(context.geometry.mark).toBe(mark);
      expect(context.scales.x).toBeDefined();
      expect(context.scales.y).toBeDefined();
      expect(context.ticks.x?.length).toBeGreaterThan(0);
      expect(context.ticks.y?.length).toBeGreaterThan(0);
    });

    it('bar mark', () => {
      const spec = parseSpec({
        specVersion: '1',
        mark: 'bar',
        encoding: {
          x: { field: 'cat', type: 'nominal' },
          y: { field: 'v', type: 'quantitative' },
        },
        data: {
          values: [
            { cat: 'a', v: 1 },
            { cat: 'b', v: 2 },
          ],
        },
      });
      const context = computeContext(spec, square.box, undefined, square.options);
      expect(context.geometry.mark).toBe('bar');
      expect(context.scales.x?.kind).toBe('band');
      expect(context.scales.y?.kind).toBe('linear');
      expect(context.ticks.x).toHaveLength(2);
    });
  });

  it('end-to-end: temporal line chart with colour series', () => {
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
          { date: '2024-01-01', price: 100, ticker: 'AAPL' },
          { date: '2024-01-02', price: 110, ticker: 'AAPL' },
          { date: '2024-01-01', price: 200, ticker: 'GOOG' },
          { date: '2024-01-02', price: 190, ticker: 'GOOG' },
        ],
      },
      config: { title: 'Prices' },
    });
    const context = computeContext(spec, box);

    expect(context.scales.x?.kind).toBe('utc');
    expect(context.scales.color?.kind).toBe('ordinal');
    if (context.geometry.mark === 'line') {
      expect(context.geometry.series).toHaveLength(2);
      expect(context.geometry.series.map((s) => s.key)).toEqual(['AAPL', 'GOOG']);
      for (const series of context.geometry.series) {
        expect(series.points).toHaveLength(2);
        expect(series.path).toMatch(/^M/);
        expect(series.color).toBeDefined();
      }
    }
  });

  it('scale hints flow through from the spec', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'line',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: {
        values: [
          { x: 1, y: 3 },
          { x: 9, y: 7 },
        ],
      },
      scales: { y: { zero: true }, x: { domain: [0, 10] } },
    });
    const context = computeContext(spec, square.box, undefined, square.options);
    expect(context.scales.x?.domain).toEqual([0, 10]);
    expect(context.scales.y?.domain).toEqual([0, 7]);
  });

  it('is pure: same inputs produce equal outputs', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: {
        values: [
          { cat: 'a', v: 1 },
          { cat: 'b', v: 2 },
        ],
      },
    });
    const first = computeContext(spec, box);
    const second = computeContext(spec, box);
    expect(first.geometry).toEqual(second.geometry);
    expect(first.dimensions).toEqual(second.dimensions);
    expect(first.ticks).toEqual(second.ticks);
  });
});
