import { computeContext } from '../../src/core/index.ts';
import { parseSpec } from '../../src/spec/index.ts';
import { describe, expect, it } from 'vite-plus/test';
import { renderContextToSvg } from '../../src/prosemirror/index.ts';

const box = { width: 640, height: 360 };

function contextFor(mark: 'bar' | 'line' | 'point' | 'area') {
  const encoding =
    mark === 'bar'
      ? {
          x: { field: 'cat', type: 'nominal' },
          y: { field: 'v', type: 'quantitative' },
        }
      : {
          x: { field: 'x', type: 'quantitative' },
          y: { field: 'y', type: 'quantitative' },
        };
  const values =
    mark === 'bar'
      ? [
          { cat: 'a', v: 1 },
          { cat: 'b', v: 2 },
        ]
      : [
          { x: 0, y: 0 },
          { x: 5, y: 10 },
          { x: 10, y: 5 },
        ];
  return computeContext(parseSpec({ specVersion: '1', mark, encoding, data: { values } }), box);
}

describe('renderContextToSvg', () => {
  it('renders a scalable SVG with a viewBox matching the outer box', () => {
    const svg = renderContextToSvg(contextFor('line'));
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('viewBox="0 0 640 360"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('renders line geometry as stroked paths', () => {
    const svg = renderContextToSvg(contextFor('line'));
    expect(svg).toMatch(/<path d="M[^"]+" fill="none" stroke="#/);
  });

  it('renders area geometry as filled paths', () => {
    const svg = renderContextToSvg(contextFor('area'));
    expect(svg).toMatch(/<path d="M[^"]+" fill="#[0-9a-f]+" fill-opacity=/);
  });

  it('renders bar geometry as rects', () => {
    const svg = renderContextToSvg(contextFor('bar'));
    expect(svg.match(/<rect /g)).toHaveLength(2);
  });

  it('renders point geometry as circles', () => {
    const svg = renderContextToSvg(contextFor('point'));
    expect(svg.match(/<circle /g)).toHaveLength(3);
  });

  it('renders axes with tick labels', () => {
    const svg = renderContextToSvg(contextFor('bar'));
    // axis lines
    expect(svg.match(/<line /g)!.length).toBeGreaterThanOrEqual(2);
    // category tick labels
    expect(svg).toContain('>a</text>');
    expect(svg).toContain('>b</text>');
  });

  it('renders and escapes the title', () => {
    const svg = renderContextToSvg(contextFor('line'), { title: 'Sales <& profit>' });
    expect(svg).toContain('Sales &lt;&amp; profit&gt;');
    expect(svg).not.toContain('Sales <& profit>');
  });

  it('adds an escaped class attribute when provided', () => {
    const svg = renderContextToSvg(contextFor('line'), { className: 'my-chart' });
    expect(svg).toContain('class="my-chart"');
  });

  it('renders empty-data charts without throwing', () => {
    const spec = parseSpec({
      specVersion: '1',
      mark: 'line',
      encoding: {
        x: { field: 'x', type: 'quantitative' },
        y: { field: 'y', type: 'quantitative' },
      },
      data: { values: [] },
    });
    const svg = renderContextToSvg(computeContext(spec, box));
    expect(svg).toMatch(/^<svg /);
    expect(svg).not.toContain('<path d=""');
  });
});
