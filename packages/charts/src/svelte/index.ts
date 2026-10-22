/**
 * @thomasfosterau/charts/svelte
 *
 * Layer 3 interpreter: a Svelte 5 component rendering portable chart specs as
 * SVG via the chart core. Pure rendering — works identically with
 * `svelte/server` and on the client. Shipped as `.svelte` source by
 * `svelte-package`, so the consumer's Svelte compiles it.
 */

export { default as Chart } from './Chart.svelte';
