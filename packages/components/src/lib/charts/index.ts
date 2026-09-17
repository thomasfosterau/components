/**
 * `@thomasfosterau/components/charts` — one component, over a declarative
 * series spec, drawn as plain SVG.
 *
 * A separate entry point so it never sits on the always-loaded path of a
 * consumer that does not use it.
 *
 * @module
 */

export { default as Chart } from './Chart.svelte';
export type { ChartKind, ChartPoint, ChartSeries } from './types.ts';
