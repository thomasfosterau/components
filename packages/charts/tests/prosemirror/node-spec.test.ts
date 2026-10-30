// @vitest-environment happy-dom
import type { ChartSpec } from '../../src/spec/index.ts';
import { DOMParser as PMDOMParser, DOMSerializer, Node, Schema } from 'prosemirror-model';
import { describe, expect, it } from 'vite-plus/test';
import {
  CHART_NODE_NAME,
  CHART_SPEC_ATTRIBUTE,
  createChartNodeSpec,
} from '../../src/prosemirror/index.ts';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      group: 'block',
      content: 'text*',
      toDOM: () => ['p', 0],
      parseDOM: [{ tag: 'p' }],
    },
    text: {},
    [CHART_NODE_NAME]: createChartNodeSpec(),
  },
});

const chartSpec: ChartSpec = {
  specVersion: '1',
  mark: 'bar',
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
  config: { title: 'Counts' },
};

describe('createChartNodeSpec', () => {
  it('creates an atom block node with a null default spec', () => {
    const nodeType = schema.nodes[CHART_NODE_NAME];
    expect(nodeType.isAtom).toBe(true);
    expect(nodeType.isBlock).toBe(true);
    const node = nodeType.create();
    expect(node.attrs['spec']).toBeNull();
  });

  describe('document JSON persistence (the Layer 1 round-trip)', () => {
    it('preserves the spec through doc.toJSON() → Node.fromJSON()', () => {
      const doc = schema.nodes['doc'].create(null, [
        schema.nodes[CHART_NODE_NAME].create({ spec: chartSpec }),
      ]);

      const json = doc.toJSON();
      // The document JSON is pure data: it must survive JSON serialisation.
      const restored = Node.fromJSON(schema, JSON.parse(JSON.stringify(json)));

      expect(restored.firstChild!.attrs['spec']).toEqual(chartSpec);
      expect(restored.eq(doc)).toBe(true);
    });
  });

  describe('DOM serialisation (copy/paste and HTML round-trips)', () => {
    it('toDOM stores the encoded spec in the data attribute', () => {
      const node = schema.nodes[CHART_NODE_NAME].create({ spec: chartSpec });
      const rendered = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;

      expect(rendered.tagName).toBe('DIV');
      const raw = rendered.getAttribute(CHART_SPEC_ATTRIBUTE);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual(chartSpec);
    });

    it('round-trips a chart node through DOM serialisation and parsing', () => {
      const doc = schema.nodes['doc'].create(null, [
        schema.nodes[CHART_NODE_NAME].create({ spec: chartSpec }),
      ]);

      const container = document.createElement('div');
      container.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));

      const parsed = PMDOMParser.fromSchema(schema).parse(container);
      expect(parsed.firstChild!.type.name).toBe(CHART_NODE_NAME);
      expect(parsed.firstChild!.attrs['spec']).toEqual(chartSpec);
    });

    it('parses a chart node with an empty spec attribute as a null spec', () => {
      const container = document.createElement('div');
      container.innerHTML = `<div ${CHART_SPEC_ATTRIBUTE}=""></div>`;

      const parsed = PMDOMParser.fromSchema(schema).parse(container);
      expect(parsed.firstChild!.type.name).toBe(CHART_NODE_NAME);
      expect(parsed.firstChild!.attrs['spec']).toBeNull();
    });

    it('does not parse divs with invalid spec JSON as chart nodes', () => {
      const container = document.createElement('div');
      container.innerHTML = `<div ${CHART_SPEC_ATTRIBUTE}='{"not": "a spec"}'><p>fallback</p></div>`;

      const parsed = PMDOMParser.fromSchema(schema).parse(container);
      expect(parsed.firstChild!.type.name).not.toBe(CHART_NODE_NAME);
    });

    it('uses a custom class name when provided', () => {
      const customSchema = new Schema({
        nodes: {
          doc: { content: 'block+' },
          paragraph: {
            group: 'block',
            content: 'text*',
            toDOM: () => ['p', 0],
            parseDOM: [{ tag: 'p' }],
          },
          text: {},
          chart: createChartNodeSpec({ className: 'cms-chart' }),
        },
      });
      const node = customSchema.nodes['chart'].create({ spec: chartSpec });
      const rendered = DOMSerializer.fromSchema(customSchema).serializeNode(node) as HTMLElement;
      expect(rendered.className).toBe('cms-chart');
    });
  });
});
