import { computeContext, type Box, type DataRows } from '@thomasfosterau/chart-core';
import { isDataRef, validateSpec, type ChartSpec } from '@thomasfosterau/chart-spec';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { EditorView, NodeView } from 'prosemirror-view';
import type { ChartNodeAttrs } from './node-spec.ts';
import { renderContextToSvg } from './render-svg.ts';

/** Resolves a data reference to rows. The host (CMS) owns how refs are fetched. */
export type DataResolver = (spec: ChartSpec) => DataRows | Promise<DataRows>;

/** Options for {@link ChartNodeView} / {@link chartNodeViewFactory}. */
export interface ChartNodeViewOptions {
  /**
   * The box used to compute geometry when the editor element has no
   * measurable width yet. The SVG scales to its container via viewBox,
   * so this only sets the aspect ratio and coordinate precision.
   */
  readonly defaultBox?: Box;
  /** Resolves data refs at edit time. Without it, ref-data charts show a placeholder. */
  readonly resolveData?: DataResolver;
  /** Extra class for the wrapper element. */
  readonly className?: string;
}

const DEFAULT_BOX: Box = { width: 640, height: 360 };

/**
 * Edit-time chart rendering inside ProseMirror.
 *
 * A NodeView is imperative DOM — exactly why the pure Layer 2 core pays off:
 * this class owns a plain <div>, computes geometry via chart-core, and sets
 * SVG markup. No framework, no reactivity.
 */
export class ChartNodeView implements NodeView {
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

  destroy(): void {
    // Invalidate any in-flight async render.
    this.renderToken += 1;
  }

  private render(): void {
    const token = ++this.renderToken;
    const spec = (this.node.attrs as ChartNodeAttrs).spec;

    if (!spec) {
      this.renderMessage('No chart configured');
      return;
    }

    // Re-validate: node attrs may come from collaborative peers or pasted docs.
    const validation = validateSpec(spec);
    if (!validation.ok) {
      this.renderMessage('Invalid chart spec');
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
      resolved
        .then((rows) => {
          if (token === this.renderToken) this.renderChart(spec, rows);
        })
        .catch(() => {
          if (token === this.renderToken) this.renderMessage('Failed to load chart data');
        });
      return;
    }

    this.renderChart(spec, resolved);
  }

  private renderChart(spec: ChartSpec, rows: DataRows | undefined): void {
    const box = this.measureBox();
    try {
      const context = computeContext(spec, box, rows);
      this.dom.innerHTML = renderContextToSvg(context, { title: spec.config?.title });
    } catch (error) {
      this.renderMessage(error instanceof Error ? error.message : 'Failed to render chart');
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
