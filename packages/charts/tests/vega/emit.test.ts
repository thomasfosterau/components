import { parseSpec, type ChartSpec } from '../../src/spec/index.ts';
import { describe, expect, it } from 'vite-plus/test';
import { emitVegaLite, VEGA_LITE_SCHEMA, VegaLiteEmitError } from '../../src/vega/index.ts';

const lineSpec = parseSpec({
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
    ],
  },
  config: { title: 'Prices', tooltip: true },
});

describe('emitVegaLite', () => {
  it('emits the Vega-Lite v6 schema marker', () => {
    expect(emitVegaLite(lineSpec).$schema).toBe(VEGA_LITE_SCHEMA);
  });

  it('translates marks one-to-one', () => {
    for (const mark of ['bar', 'line', 'point', 'area'] as const) {
      const spec: ChartSpec = { ...lineSpec, mark };
      expect(emitVegaLite(spec).mark.type).toBe(mark);
    }
  });

  it('translates typed encodings one-to-one (the Vega-Lite-shaped proof)', () => {
    const emitted = emitVegaLite(lineSpec);
    expect(emitted.encoding).toEqual({
      x: { field: 'date', type: 'temporal' },
      y: { field: 'price', type: 'quantitative' },
      color: { field: 'ticker', type: 'nominal' },
    });
  });

  it('passes inline data values through', () => {
    const emitted = emitVegaLite(lineSpec);
    expect(emitted.data).toEqual({
      values: [
        { date: '2024-01-01', price: 100, ticker: 'AAPL' },
        { date: '2024-01-02', price: 110, ticker: 'AAPL' },
      ],
    });
  });

  it('maps url data refs onto Vega-Lite url data', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'point',
      encoding: {
        x: { field: 'a', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative' },
      },
      data: { ref: { kind: 'url', id: 'https://example.com/data.json' } },
    });
    expect(emitVegaLite(spec).data).toEqual({ url: 'https://example.com/data.json' });
  });

  it('throws a clear error for query/node refs without pre-resolved rows', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    expect(() => emitVegaLite(spec)).toThrow(VegaLiteEmitError);
    expect(() => emitVegaLite(spec)).toThrow(/host must resolve/);
  });

  it('uses pre-resolved rows for query/node refs', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'node', id: 'dataset-1' } },
    });
    const rows = [{ cat: 'a', v: 1 }];
    expect(emitVegaLite(spec, { rows }).data).toEqual({ values: rows });
  });

  it('maps title and tooltip config', () => {
    const emitted = emitVegaLite(lineSpec);
    expect(emitted.title).toBe('Prices');
    expect(emitted.mark.tooltip).toBe(true);
  });

  it('omits title and tooltip when not configured', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'point',
      encoding: {
        x: { field: 'a', type: 'quantitative' },
        y: { field: 'b', type: 'quantitative' },
      },
      data: { values: [] },
    });
    const emitted = emitVegaLite(spec);
    expect(emitted).not.toHaveProperty('title');
    expect(emitted.mark).not.toHaveProperty('tooltip');
  });

  it('maps scale hints onto Vega-Lite scale blocks', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'line',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: { values: [{ x: 1, y: 2 }] },
      scales: {
        x: { domain: [0, 100] },
        y: { zero: true, nice: true },
      },
    });
    const emitted = emitVegaLite(spec);
    expect(emitted.encoding.x?.scale).toEqual({ domain: [0, 100] });
    expect(emitted.encoding.y?.scale).toEqual({ zero: true, nice: true });
  });

  it('ignores web-only extensions (capability matrix: native/Vega interpreters ignore them)', () => {
    const withExtensions = parseSpec({
      specVersion: '1',
      mark: 'line',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: { values: [{ x: 1, y: 2 }] },
      extensions: { preferredRenderer: 'webgpu', interactions: { brush: true } },
    });
    const emitted = emitVegaLite(withExtensions);
    expect(JSON.stringify(emitted)).not.toContain('webgpu');
    expect(JSON.stringify(emitted)).not.toContain('brush');
  });

  it('defaults to responsive container width', () => {
    expect(emitVegaLite(lineSpec).width).toBe('container');
    expect(emitVegaLite(lineSpec, { width: 400, height: 300 }).width).toBe(400);
    expect(emitVegaLite(lineSpec, { width: 400, height: 300 }).height).toBe(300);
  });

  it('emits JSON-serialisable output', () => {
    const emitted = emitVegaLite(lineSpec);
    expect(JSON.parse(JSON.stringify(emitted))).toEqual(emitted);
  });
});

describe('tree mark (spec 1.1)', () => {
  it('is an unsupported-mark error, not a malformed emit', async () => {
    const { taxonomy } = await import('../fixtures/taxonomy.ts');
    const { VegaLiteEmitError } = await import('../../src/vega/index.ts');
    expect(() => emitVegaLite(taxonomy)).toThrow(VegaLiteEmitError);
    try {
      emitVegaLite(taxonomy);
    } catch (error) {
      expect((error as InstanceType<typeof VegaLiteEmitError>).reason).toBe('unsupported-mark');
    }
  });
});
