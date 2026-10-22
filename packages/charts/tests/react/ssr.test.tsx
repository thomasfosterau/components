/**
 * Server-side rendering tests: the publish path renders charts to SVG markup
 * with no DOM and no client JavaScript.
 */
import { parseSpec, type ChartSpec } from '../../src/spec/index.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { Chart } from '../../src/react/index.ts';

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

describe('Chart SSR', () => {
  it('renders an SVG with a viewBox (scales via CSS, no measurement needed)', () => {
    const html = renderToStaticMarkup(<Chart spec={lineSpec} width={640} height={360} />);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 640 360"');
    expect(html).toContain('role="img"');
  });

  it('renders one path per colour series', () => {
    const html = renderToStaticMarkup(<Chart spec={lineSpec} />);
    expect(html.match(/<path /g)).toHaveLength(2);
  });

  it('renders the title', () => {
    const html = renderToStaticMarkup(<Chart spec={lineSpec} />);
    expect(html).toContain('>Prices</text>');
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
    const html = renderToStaticMarkup(<Chart spec={spec} />);
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
    const html = renderToStaticMarkup(<Chart spec={spec} />);
    expect(html).toContain('>alpha</text>');
    expect(html).toContain('>beta</text>');
  });

  it('renders ref-data specs when rows are passed', () => {
    const refSpec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    const html = renderToStaticMarkup(<Chart spec={refSpec} data={[{ cat: 'a', v: 1 }]} />);
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

    it('renders an error fallback for invalid specs', () => {
      const html = renderToStaticMarkup(<Chart spec={{ bogus: true } as unknown as ChartSpec} />);
      expect(html).toContain('role="alert"');
      expect(html).toContain('Invalid chart spec');
    });

    it('renders an error fallback for unresolved ref data', () => {
      const html = renderToStaticMarkup(<Chart spec={refSpec} />);
      expect(html).toContain('stored externally');
    });

    it('renders a custom fallback node', () => {
      const html = renderToStaticMarkup(<Chart spec={refSpec} fallback={<em>no chart</em>} />);
      expect(html).toBe('<em>no chart</em>');
    });

    it('renders a custom fallback function with the message', () => {
      const html = renderToStaticMarkup(
        <Chart spec={refSpec} fallback={(message) => <span>{message}</span>} />,
      );
      expect(html).toContain('<span>');
      expect(html).toContain('stored externally');
    });
  });
});
