/**
 * @thomasfosterau/charts/core
 *
 * Layer 2 of the portable chart architecture: the pure TypeScript geometry
 * core. Turns (spec, measured box, resolved data) into scales, dimensions,
 * geometry, and ticks.
 *
 * No DOM, no reactivity, no rendering, no data fetching — interpreters
 * (Layer 3) own all of that.
 */

export { computeContext } from './context.ts';

export { resolveChart, type ResolvedChart } from './resolve.ts';

export { computeDimensions, DEFAULT_MARGINS } from './layout.ts';

export { makeAccessor, type FieldValue } from './accessor.ts';

export {
  CATEGORICAL_PALETTE,
  DEFAULT_POINT_RADIUS,
  DEFAULT_RADIUS_RANGE,
  resolveColorScale,
  resolvePositionalScale,
  resolveSizeScale,
  type PositionalScale,
} from './scale.ts';

export { computeTicks, DEFAULT_TICK_COUNT } from './ticks.ts';

// Stateless geometry builders, for interpreters that need finer control
// than computeContext provides.
export { buildLineGeometry } from './geometry/line.ts';
export { buildAreaGeometry } from './geometry/area.ts';
export { buildBarGeometry } from './geometry/bar.ts';
export { buildPointGeometry } from './geometry/point.ts';

export type {
  Box,
  ChartContext,
  ChartScales,
  ChartTicks,
  ComputeContextOptions,
  DataRows,
  Dimensions,
  DomainValue,
  Margins,
  ResolvedScale,
  ScaleKind,
  Tick,
} from './types.ts';

export type {
  AreaGeometry,
  BarGeometry,
  BarRect,
  Geometry,
  LineGeometry,
  PointCircle,
  PointGeometry,
  Series,
  SeriesPoint,
} from './geometry/types.ts';
