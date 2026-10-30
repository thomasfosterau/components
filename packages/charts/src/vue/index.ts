/**
 * `@thomasfosterau/charts/vue`
 *
 * Layer 3 interpreter: Vue 3 components rendering portable chart specs as
 * SVG via the chart core. Written as plain render functions (no SFC
 * compilation required); works identically with Vue SSR and on the client.
 */

export { Chart } from './Chart.ts';
export { renderAxes, renderMarks } from './render.ts';
