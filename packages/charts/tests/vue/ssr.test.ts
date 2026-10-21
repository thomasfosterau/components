/**
 * Server-side rendering tests: the publish path renders charts to SVG markup
 * with no DOM and no client JavaScript.
 */
import { parseSpec, type ChartSpec } from '../../src/spec/index.ts';
import { describe, expect, it } from 'vitest';
import { createSSRApp, h, type Component } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Chart } from '../../src/vue/index.ts';

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
      { date: '2024-01-01', price: 200, ticker: 'GOOG' },
      { date: '2024-01-02', price: 190, ticker: 'GOOG' },
    ],
  },
  config: { title: 'Prices' },
});

function ssr(props: Record<string, unknown>, slots?: Record<string, unknown>): Promise<string> {
  return renderToString(createSSRApp({ render: () => h(Chart as Component, props, slots) }));
}

describe('Chart SSR', () => {
  it('renders an SVG with a viewBox (scales via CSS, no measurement needed)', async () => {
    const html = await ssr({ spec: lineSpec, width: 640, height: 360 });
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 640 360"');
    expect(html).toContain('role="img"');
  });

  it('renders one path per colour series', async () => {
    const html = await ssr({ spec: lineSpec });
    expect(html.match(/<path /g)).toHaveLength(2);
  });

  it('renders the title', async () => {
    const html = await ssr({ spec: lineSpec });
    expect(html).toContain('>Prices</text>');
    expect(html).toContain('aria-label="Prices"');
  });

  it.each([
    ['bar', '<rect '],
    ['point', '<circle '],
    ['area', '<path '],
  ] as const)('renders %s marks', async (mark, element) => {
    const spec = parseSpec({
      specVersion: '1',
      mark,
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
    const html = await ssr({ spec });
    expect(html).toContain(element);
    expect(html).toContain(`data-mark="${mark}"`);
  });

  it('renders axes with tick labels', async () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: {
        values: [
          { cat: 'alpha', v: 1 },
          { cat: 'beta', v: 2 },
        ],
      },
    });
    const html = await ssr({ spec });
    expect(html).toContain('>alpha</text>');
    expect(html).toContain('>beta</text>');
  });

  it('renders ref-data specs when rows are passed', async () => {
    const refSpec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    const html = await ssr({ spec: refSpec, data: [{ cat: 'a', v: 1 }] });
    expect(html).toContain('<rect ');
  });

  describe('fallback states', () => {
    const refSpec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });

    it('renders an error fallback for invalid specs', async () => {
      const html = await ssr({ spec: { bogus: true } as unknown as ChartSpec });
      expect(html).toContain('role="alert"');
      expect(html).toContain('Invalid chart spec');
    });

    it('renders an error fallback for unresolved ref data', async () => {
      const html = await ssr({ spec: refSpec });
      expect(html).toContain('stored externally');
    });

    it('renders the fallback slot with the message', async () => {
      const html = await ssr(
        { spec: refSpec },
        { fallback: ({ message }: { message: string }) => h('em', message) },
      );
      expect(html).toContain('<em>');
      expect(html).toContain('stored externally');
    });
  });
});
