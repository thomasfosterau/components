/**
 * @thomasfosterau/charts/prosemirror
 *
 * Layer 3 interpreter: edit-time chart rendering inside ProseMirror.
 *
 * - {@link createChartNodeSpec} — the atom node schema persisting the
 *   portable chart spec in node attrs (pure JSON, so document round-trips
 *   carry the spec for free)
 * - {@link ChartNodeView} / {@link chartNodeViewFactory} — imperative DOM
 *   NodeView that computes geometry via chart-core and draws SVG
 * - {@link renderContextToSvg} — pure ChartContext → SVG string rendering
 */

export {
  CHART_NODE_NAME,
  CHART_SPEC_ATTRIBUTE,
  createChartNodeSpec,
  type ChartNodeAttrs,
  type ChartNodeSpecOptions,
} from './node-spec.ts';

export {
  ChartNodeView,
  chartNodeViewFactory,
  type ChartNodeViewOptions,
  type DataResolver,
} from './node-view.ts';

export { renderContextToSvg, type RenderSvgOptions } from './render-svg.ts';
