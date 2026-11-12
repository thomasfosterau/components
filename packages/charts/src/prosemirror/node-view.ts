import { resolveChart, type Box, type DataRows } from '../core/index.ts';
import { isDataRef, validateSpec, type ChartSpec } from '../spec/index.ts';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { EditorView, NodeView } from 'prosemirror-view';
import { chartNodeAttrs } from './node-spec.ts';
import { renderContextToSvg, renderDataTable, renderTreeOutline } from './render-svg.ts';

/** Resolves a data reference to rows. The host (CMS) owns how refs are fetched. */
export type DataResolver = (spec: ChartSpec) => DataRows | Promise<DataRows>;

/** Options for {@link ChartNodeView} / {@link chartNodeViewFactory}. */
export interface ChartNodeViewOptions {
  /**
   * The box used to compute geometry when the editor element has no
   * measurable width yet. The SVG scales to its container via viewBox,
   * so this only sets the aspect ratio and coordinate precision.
   */
  readonly defaultBox?: Box | undefined;
  /** Resolves data refs at edit time. Without it, ref-data charts show a placeholder. */
  readonly resolveData?: DataResolver | undefined;
  /** Extra class for the wrapper element. */
  readonly className?: string | undefined;
}

const DEFAULT_BOX: Box = { width: 640, height: 360 };

/**
 * Edit-time chart rendering inside ProseMirror.
 *
 * A NodeView is imperative DOM — exactly why the pure Layer 2 core pays off:
 * this class owns a plain <div>, computes geometry via the `/core` entry, and sets
 * SVG markup. No framework, no reactivity.
 *
 * `dom` is a `<div class="chart-node-view">` holding the rendered SVG. The
 * spec is re-validated on every render, and the chart's data is appended as a
 * visually hidden `<table data-chart-table>` after the SVG. For a newer `1.N`
 * spec whose mark it cannot draw it shows
 * `<div class="chart-node-view__unsupported" data-chart-unsupported>` with the
 * message and the table, visible (`Unsupported chart type` when that spec's
 * data is a `ref`, since `resolveData` takes a `ChartSpec`). Otherwise it
 * shows a `<div class="chart-node-view__placeholder">` with a message: no
 * chart configured, invalid spec, data stored externally when there is no
 * `resolveData`, loading, failed to load, or the core's error. It measures its
 * own width and keeps `defaultBox`'s aspect ratio. `update` re-renders for a
 * node of the same type (and returns `false` for any other), `ignoreMutation`
 * returns `true`, and `destroy` drops any pending async resolution.
 */
export class ChartNodeView implements NodeView {
  /** The wrapper element ProseMirror mounts; it holds the SVG or a placeholder message. */
  readonly dom: HTMLElement;

  private node: ProseMirrorNode;
  private readonly options: ChartNodeViewOptions;
  /** Guards against stale async data resolutions racing a newer render. */
  private renderToken = 0;

  constructor(node: ProseMirrorNode, _view: EditorView, options?: ChartNodeViewOptions) {
    this.node = node;
    this.options = options ?? {};
    this.dom = document.createElement('div');
    this.dom.className = this.options.className ?? 'chart-node-view';
    this.render();
  }

  /** ProseMirror calls this when the node updates (e.g. the spec attr changes). */
  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.render();
    return true;
  }

  /** The NodeView owns its DOM; editor mutations inside it are ignored. */
  ignoreMutation(): boolean {
    return true;
  }

  /** Invalidates any in-flight async data resolution so it cannot render after removal. */
  destroy(): void {
    // Invalidate any in-flight async render.
    this.renderToken += 1;
  }

  private render(): void {
    const token = ++this.renderToken;
    const spec = chartNodeAttrs(this.node.attrs).spec;

    if (!spec) {
      this.renderMessage('No chart configured');
      return;
    }

    // Re-validate: node attrs may come from collaborative peers or pasted docs.
    const validation = validateSpec(spec);
    if (!validation.ok) {
      const unsupported = validation.unsupported;
      if (unsupported === undefined) this.renderMessage('Invalid chart spec');
      // A newer mark: its data as a visible table. `resolveData` takes a
      // `ChartSpec`, which this is not, so a ref-data one stays a message.
      else if (isDataRef(unsupported.spec.data)) this.renderMessage('Unsupported chart type');
      else this.renderChart(spec, undefined);
      return;
    }

    if (isDataRef(validation.value.data)) {
      this.renderRefData(validation.value, token);
      return;
    }

    this.renderChart(validation.value, undefined);
  }

  private renderRefData(spec: ChartSpec, token: number): void {
    const resolve = this.options.resolveData;
    if (!resolve) {
      this.renderMessage('Chart data is stored externally');
      return;
    }

    const resolved = resolve(spec);
    if (isPromise(resolved)) {
      this.renderMessage('Loading chart data…');
      void this.renderWhenResolved(spec, resolved, token);
      return;
    }

    this.renderChart(spec, resolved);
  }

  /** Draw the chart once its data arrives, unless a later render superseded this one. */
  private async renderWhenResolved(
    spec: unknown,
    resolved: Promise<DataRows>,
    token: number,
  ): Promise<void> {
    try {
      const rows = await resolved;
      if (token === this.renderToken) this.renderChart(spec, rows);
    } catch {
      if (token === this.renderToken) this.renderMessage('Failed to load chart data');
    }
  }

  /**
   * Draws the chart, then its data table visually hidden; or, for a newer
   * mark this interpreter does not know, the table visible.
   */
  private renderChart(spec: unknown, rows: DataRows | undefined): void {
    const resolved = resolveChart(spec, this.measureBox(), rows);
    switch (resolved.kind) {
      case 'error':
        this.renderMessage(resolved.message);
        return;
      case 'unsupported': {
        const fallback = document.createElement('div');
        fallback.className = 'chart-node-view__unsupported';
        fallback.dataset['chartUnsupported'] = '';
        const message = document.createElement('p');
        message.textContent = resolved.message;
        fallback.append(message);
        fallback.insertAdjacentHTML('beforeend', renderDataTable(resolved.table));
        this.dom.replaceChildren(fallback);
        return;
      }
      case 'ready': {
        const { context, table } = resolved;
        this.dom.innerHTML =
          renderContextToSvg(context, { title: resolved.spec.config?.title }) +
          renderTreeOutline(context) +
          renderDataTable(table, { hidden: true });
      }
    }
  }

  private renderMessage(message: string): void {
    const placeholder = document.createElement('div');
    placeholder.className = 'chart-node-view__placeholder';
    placeholder.textContent = message;
    this.dom.replaceChildren(placeholder);
  }

  private measureBox(): Box {
    const fallback = this.options.defaultBox ?? DEFAULT_BOX;
    const width = this.dom.clientWidth;
    if (width > 0) {
      // Preserve the configured aspect ratio at the measured width.
      return { width, height: Math.round((width * fallback.height) / fallback.width) };
    }
    return fallback;
  }
}

/**
 * Creates a NodeView factory for ProseMirror's `nodeViews` editor prop:
 *
 * ```ts
 * new EditorView(place, {
 *   state,
 *   nodeViews: { chart: chartNodeViewFactory({ resolveData }) },
 * });
 * ```
 */
export function chartNodeViewFactory(
  options?: ChartNodeViewOptions,
): (node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) => ChartNodeView {
  return (node, view) => new ChartNodeView(node, view, options);
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then: unknown }).then === 'function'
  );
}
