/**
 * The strongest validation that the portable spec is Vega-Lite-shaped:
 * every emitted spec must compile with the *real* Vega-Lite compiler
 * without errors or warnings.
 */
import { parseSpec } from '@thomasfosterau/chart-spec';
import { describe, expect, it } from 'vitest';
import { compile } from 'vega-lite';
import { emitVegaLite } from '../src/index.ts';
import type { TopLevelSpec } from 'vega-lite';

function compileEmitted(
  spec: Parameters<typeof emitVegaLite>[0],
  options?: Parameters<typeof emitVegaLite>[1],
) {
  const emitted = emitVegaLite(spec, options);
  // Cast through the compiler's own type: if the structural shapes diverge,
  // compile() throws or logs, and the test fails.
  return compile(emitted as unknown as TopLevelSpec, {
    logger: failOnWarnLogger(),
  });
}

function failOnWarnLogger() {
  const messages: string[] = [];
  return {
    level: () => failOnWarnLogger(),
    info: () => failOnWarnLogger(),
    debug: () => failOnWarnLogger(),
    warn: (...args: readonly unknown[]) => {
      messages.push(args.join(' '));
      throw new Error(`Vega-Lite warning: ${args.join(' ')}`);
    },
    error: (...args: readonly unknown[]) => {
      throw new Error(`Vega-Lite error: ${args.join(' ')}`);
    },
  };
}

describe('emitted specs compile with the real Vega-Lite compiler', () => {
  it.each(['bar', 'line', 'point', 'area'] as const)('%s mark with categorical x', (mark) => {
    const spec = parseSpec({
      specVersion: '1',
      mark,
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'count', type: 'quantitative' },
      },
      data: {
        values: [
          { category: 'a', count: 1 },
          { category: 'b', count: 2 },
        ],
      },
    });
    const result = compileEmitted(spec, { width: 400, height: 300 });
    expect(result.spec).toBeDefined();
    expect(result.spec.data).toBeDefined();
  });

  it('temporal line chart with colour series and tooltip', () => {
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
        ],
      },
      config: { title: 'Prices', tooltip: true },
    });
    const result = compileEmitted(spec, { width: 400, height: 300 });
    expect(JSON.stringify(result.spec)).toContain('AAPL');
  });

  it('scatter with size encoding and scale hints', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'point',
      encoding: {
        x: { field: 'gdp', type: 'quantitative' },
        y: { field: 'life', type: 'quantitative' },
        size: { field: 'population', type: 'quantitative' },
        color: { field: 'region', type: 'nominal' },
      },
      data: {
        values: [
          { gdp: 1000, life: 70, population: 1000000, region: 'EU' },
          { gdp: 2000, life: 80, population: 5000000, region: 'APAC' },
        ],
      },
      scales: { x: { zero: false, nice: true }, y: { domain: [60, 90] } },
    });
    const result = compileEmitted(spec, { width: 400, height: 300 });
    expect(result.spec).toBeDefined();
  });

  it('url-referenced data', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'area',
      encoding: {
        x: { field: 'date', type: 'temporal' },
        y: { field: 'value', type: 'quantitative' },
      },
      data: { ref: { kind: 'url', id: 'https://example.com/data.json' } },
    });
    const result = compileEmitted(spec, { width: 400, height: 300 });
    expect(JSON.stringify(result.spec)).toContain('https://example.com/data.json');
  });

  it('ordinal encodings', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'quarter', type: 'ordinal' },
        y: { field: 'revenue', type: 'quantitative' },
      },
      data: {
        values: [
          { quarter: 'Q1', revenue: 10 },
          { quarter: 'Q2', revenue: 20 },
        ],
      },
    });
    const result = compileEmitted(spec, { width: 400, height: 300 });
    expect(result.spec).toBeDefined();
  });
});
