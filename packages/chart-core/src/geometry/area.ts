import type { Channel } from '@thomasfosterau/chart-spec';
import { area as d3Area } from 'd3-shape';
import type { PositionalScale } from '../scale.ts';
import type { DataRows, ResolvedScale } from '../types.ts';
import { buildSeries } from './line.ts';
import { baselineOf } from './position.ts';
import type { AreaGeometry, SeriesPoint } from './types.ts';

/**
 * Builds area chart geometry: like a line, but each series path is closed
 * down to the zero baseline (or the bottom of the plot when zero is not in
 * the y domain).
 */
export function buildAreaGeometry(args: {
  readonly data: DataRows;
  readonly x: Channel;
  readonly y: Channel;
  readonly xScale: PositionalScale;
  readonly yScale: PositionalScale;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
}): AreaGeometry {
  const baseline = baselineOf(args.yScale);

  return {
    mark: 'area',
    series: buildSeries({
      ...args,
      pathOf: (points) => areaPathOf(points, baseline),
    }),
  };
}

function areaPathOf(points: ReadonlyArray<SeriesPoint>, baseline: number): string {
  const generator = d3Area<SeriesPoint>()
    .x((point) => point.x)
    .y1((point) => point.y)
    .y0(baseline);
  return generator([...points]) ?? '';
}
