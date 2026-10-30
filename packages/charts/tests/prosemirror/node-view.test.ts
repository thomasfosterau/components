// @vitest-environment happy-dom
import type { DataRows } from '../../src/core/index.ts';
import type { ChartSpec } from '../../src/spec/index.ts';
import { Schema } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { describe, expect, it, vi } from 'vite-plus/test';
import {
  CHART_NODE_NAME,
  ChartNodeView,
  chartNodeViewFactory,
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

const chartType = schema.nodes[CHART_NODE_NAME];

const inlineSpec: ChartSpec = {
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
};

const refSpec: ChartSpec = {
  specVersion: '1',
  mark: 'bar',
  encoding: {
    x: { field: 'cat', type: 'nominal' },
    y: { field: 'v', type: 'quantitative' },
  },
  data: { ref: { kind: 'query', id: 'sales' } },
};

const refRows: DataRows = [
  { cat: 'a', v: 1 },
  { cat: 'b', v: 2 },
];

// The NodeView never touches the EditorView in these scenarios.
const fakeView = {} as EditorView;

function viewFor(spec: ChartSpec | null, options?: ConstructorParameters<typeof ChartNodeView>[2]) {
  return new ChartNodeView(chartType.create({ spec }), fakeView, options);
}

describe('ChartNodeView', () => {
  it('renders inline-data specs as SVG', () => {
    const view = viewFor(inlineSpec);
    expect(view.dom.querySelector('svg')).toBeTruthy();
    expect(view.dom.querySelectorAll('circle')).toHaveLength(2);
  });

  it('renders a placeholder for a null spec', () => {
    const view = viewFor(null);
    expect(view.dom.querySelector('svg')).toBeNull();
    expect(view.dom.textContent).toContain('No chart configured');
  });

  it('renders a placeholder for an invalid spec (e.g. from a collaborative peer)', () => {
    const view = viewFor({ bogus: true } as unknown as ChartSpec);
    expect(view.dom.textContent).toContain('Invalid chart spec');
  });

  it('renders a placeholder for ref data without a resolver', () => {
    const view = viewFor(refSpec);
    expect(view.dom.querySelector('svg')).toBeNull();
    expect(view.dom.textContent).toContain('stored externally');
  });

  it('renders ref data with a synchronous resolver', () => {
    const view = viewFor(refSpec, { resolveData: () => refRows });
    expect(view.dom.querySelectorAll('rect')).toHaveLength(2);
  });

  it('renders ref data with an async resolver', async () => {
    const view = viewFor(refSpec, { resolveData: () => Promise.resolve(refRows) });
    expect(view.dom.textContent).toContain('Loading');

    await vi.waitFor(() => {
      expect(view.dom.querySelectorAll('rect')).toHaveLength(2);
    });
  });

  it('renders a failure placeholder when the resolver rejects', async () => {
    const view = viewFor(refSpec, { resolveData: () => Promise.reject(new Error('nope')) });

    await vi.waitFor(() => {
      expect(view.dom.textContent).toContain('Failed to load chart data');
    });
  });

  it('ignores stale async resolutions after destroy', async () => {
    let release: (rows: DataRows) => void;
    const pending = new Promise<DataRows>((resolve) => {
      release = resolve;
    });
    const view = viewFor(refSpec, { resolveData: () => pending });
    view.destroy();
    release!(refRows);
    await pending;
    // Still showing the loading placeholder; the stale resolution was dropped.
    expect(view.dom.querySelector('svg')).toBeNull();
  });

  it('re-renders when the node updates with a new spec', () => {
    const view = viewFor(inlineSpec);
    expect(view.dom.querySelectorAll('circle')).toHaveLength(2);

    const updatedSpec: ChartSpec = {
      ...inlineSpec,
      data: {
        values: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: 10 },
        ],
      },
    };
    const updated = view.update(chartType.create({ spec: updatedSpec }));
    expect(updated).toBe(true);
    expect(view.dom.querySelectorAll('circle')).toHaveLength(3);
  });

  it('rejects updates for a different node type', () => {
    const view = viewFor(inlineSpec);
    const paragraph = schema.nodes['paragraph'].create();
    expect(view.update(paragraph)).toBe(false);
  });

  it('ignores DOM mutations (it owns its DOM)', () => {
    const view = viewFor(inlineSpec);
    expect(view.ignoreMutation()).toBe(true);
  });

  it('renders the chart title from config', () => {
    const view = viewFor({ ...inlineSpec, config: { title: 'My scatter' } });
    expect(view.dom.innerHTML).toContain('My scatter');
  });
});

describe('chartNodeViewFactory', () => {
  it('creates NodeViews compatible with the nodeViews editor prop', () => {
    const factory = chartNodeViewFactory();
    const view = factory(chartType.create({ spec: inlineSpec }), fakeView, () => 0);
    expect(view).toBeInstanceOf(ChartNodeView);
    expect(view.dom.querySelector('svg')).toBeTruthy();
  });
});
