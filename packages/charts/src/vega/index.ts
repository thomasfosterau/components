/**
 * @thomasfosterau/charts/vega
 *
 * Layer 3 interpreter: emits Vega-Lite specifications from portable chart
 * specs, as an escape hatch and SSR fallback. Also serves as the living
 * proof that the portable spec is genuinely Vega-Lite-shaped.
 */

export {
  emitVegaLite,
  VEGA_LITE_SCHEMA,
  VegaLiteEmitError,
  type EmitVegaLiteOptions,
} from './emit.ts';

export type {
  VegaLiteData,
  VegaLiteEncoding,
  VegaLiteFieldDef,
  VegaLiteSecondaryFieldDef,
  VegaLiteSpec,
} from './types.ts';
