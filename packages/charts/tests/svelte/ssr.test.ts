/**
 * Server-side rendering tests: the Svelte interpreter renders charts to SVG
 * markup through `svelte/server`, with no DOM and no client JavaScript.
 */
import { parseSpec, type ChartSpec } from '../../src/spec/index.ts';
import { createRawSnippet, type ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Chart } from '../../src/svelte/index.ts';

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

const refSpec = parseSpec({
  specVersion: '1',
  mark: 'bar',
  encoding: {
    x: { field: 'cat', type: 'nominal' },
    y: { field: 'v', type: 'quantitative' },
  },
  data: { ref: { kind: 'query', id: 'sales' } },
});

function ssr(props: ComponentProps<typeof Chart>): string {
  return render(Chart, { props }).body;
}

describe('Chart SSR', () => {
  it('renders an SVG with a viewBox (scales via CSS, no measurement needed)', () => {
    const html = ssr({ spec: lineSpec, width: 640, height: 360 });
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 640 360"');
    expect(html).toContain('role="img"');
  });

  it('renders one path per colour series', () => {
    const html = ssr({ spec: lineSpec });
    expect(html.match(/<path /g)).toHaveLength(2);
  });

  it('renders the title and names the SVG by it', () => {
    const html = ssr({ spec: lineSpec });
    expect(html).toMatch(/>Prices<\/text>/);
    expect(html).toContain('aria-label="Prices"');
  });

  it.each([
    ['bar', '<rect '],
    ['point', '<circle '],
    ['area', '<path '],
  ] as const)('renders %s marks', (mark, element) => {
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
    const html = ssr({ spec });
    expect(html).toContain(element);
    expect(html).toContain(`data-mark="${mark}"`);
  });

  it('renders axes with tick labels', () => {
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
    const html = ssr({ spec });
    expect(html).toContain('data-axes');
    expect(html).toMatch(/>alpha<\/text>/);
    expect(html).toMatch(/>beta<\/text>/);
  });

  it('renders ref-data specs when rows are passed', () => {
    const html = ssr({ spec: refSpec, data: [{ cat: 'a', v: 1 }] });
    expect(html).toContain('<rect ');
  });

  it('spreads native attributes onto the SVG, letting the caller rename it', () => {
    const html = ssr({
      spec: lineSpec,
      class: 'sales-chart',
      id: 'sales',
      'data-testid': 'chart',
      'aria-label': 'Share prices, January 2024',
    });
    expect(html).toContain('class="sales-chart"');
    expect(html).toContain('id="sales"');
    expect(html).toContain('data-testid="chart"');
    expect(html).toContain('aria-label="Share prices, January 2024"');
    expect(html).not.toContain('aria-label="Prices"');
  });

  describe('fallback states', () => {
    it('renders an alert for invalid specs', () => {
      // A document from outside, as a caller holding unchecked JSON would pass it.
      const bogus: ChartSpec = JSON.parse('{"bogus":true}');
      const html = ssr({ spec: bogus, class: 'sales-chart' });
      expect(html).toContain('role="alert"');
      expect(html).toContain('data-chart-error');
      expect(html).toContain('class="sales-chart"');
      expect(html).toContain('Invalid chart spec');
    });

    it('renders an alert for unresolved ref data', () => {
      const html = ssr({ spec: refSpec });
      expect(html).toContain('stored externally');
    });

    it('renders the fallback snippet with the message', () => {
      const fallback = createRawSnippet((message: () => string) => ({
        render: () => `<em>${message()}</em>`,
      }));
      const html = ssr({ spec: refSpec, fallback });
      expect(html).toContain('<em>');
      expect(html).toContain('stored externally');
      expect(html).not.toContain('role="alert"');
    });
  });
});

describe('tree mark (spec 1.1) in SSR', () => {
  it('draws boxes and links beside a nested list in depth-first order', async () => {
    const { taxonomy, TAXONOMY_ORDER } = await import('../fixtures/taxonomy.ts');
    const { body } = render(Chart, { props: { spec: taxonomy } });
    expect(body).toContain('role="img"');
    expect(body.match(/<rect /g)).toHaveLength(6);
    expect(body.match(/<path /g)).toHaveLength(5);
    const order = [...body.matchAll(/<li>\s*(?:<!---->)?\s*([^<,]+)/g)].map((match) =>
      (match[1] ?? '').trim(),
    );
    expect(order).toEqual([...TAXONOMY_ORDER]);
  });
});

describe('data table (#304) in SSR', () => {
  it('renders the data as a visually hidden table beside the named SVG', () => {
    const html = ssr({ spec: lineSpec });
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Prices"');
    const table = html.slice(html.indexOf('</svg>'));
    expect(table).toMatch(/<table style="position:absolute;[^"]*" data-chart-table="">/);
    expect(table).toContain('<caption>Prices</caption>');
    expect(table).toContain('<th scope="col">date</th>');
    expect(table).toContain('<td>2024-01-01</td>');
    expect(table.match(/<tr>/g)).toHaveLength(5);
  });

  it('captions an untitled chart with tableLabel', () => {
    expect(ssr({ spec: refSpec, data: [{ cat: 'a', v: 1 }] })).toContain(
      '<caption>Chart data</caption>',
    );
    expect(ssr({ spec: refSpec, data: [{ cat: 'a', v: 1 }], tableLabel: 'Ventes' })).toContain(
      '<caption>Ventes</caption>',
    );
  });

  it('draws a newer spec from its known subset', () => {
    const future: ChartSpec = JSON.parse(
      JSON.stringify({
        ...lineSpec,
        specVersion: '1.4',
        encoding: { ...lineSpec.encoding, strokeDash: { field: 'ticker', type: 'nominal' } },
      }),
    );
    const html = ssr({ spec: future });
    expect(html.match(/<path /g)).toHaveLength(2);
    expect(html).not.toContain('data-chart-error');
  });

  it('renders an unknown mark as the visible table, with its message', () => {
    const sankey: ChartSpec = JSON.parse(
      JSON.stringify({ ...lineSpec, specVersion: '1.2', mark: 'sankey' }),
    );
    const html = ssr({ spec: sankey, class: 'sales-chart', rangeSeparator: ' – ' });
    expect(html).not.toContain('<svg');
    expect(html).toContain('<div class="sales-chart" data-chart-unsupported="">');
    expect(html).toContain('This chart type is not supported here');
    expect(html).toMatch(/<table data-chart-table="">/);
    expect(html).toContain('<td>AAPL</td>');
    expect(ssr({ spec: sankey, unsupportedMessage: 'Non pris en charge' })).toContain(
      'Non pris en charge',
    );
  });
});
