import type { Channel } from '@thomasfosterau/chart-spec';
import { line as d3Line } from 'd3-shape';
import { makeAccessor } from '../accessor.ts';
import type { PositionalScale } from '../scale.ts';
import type { DataRows, ResolvedScale } from '../types.ts';
import { positionOf } from './position.ts';
import { splitSeries } from './series.ts';
import type { LineGeometry, Series, SeriesPoint } from './types.ts';

/** Builds line chart geometry: one series per colour category, each with points and an SVG path. */
export function buildLineGeometry(args: {
  readonly data: DataRows;
  readonly x: Channel;
  readonly y: Channel;
  readonly xScale: PositionalScale;
  readonly yScale: PositionalScale;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
}): LineGeometry {
  return {
    mark: 'line',
    series: buildSeries(args),
  };
}

/** Shared series-of-points construction for line and area marks. */
export function buildSeries(args: {
  readonly data: DataRows;
  readonly x: Channel;
  readonly y: Channel;
  readonly xScale: PositionalScale;
  readonly yScale: PositionalScale;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
  readonly pathOf?: (points: ReadonlyArray<SeriesPoint>) => string;
}): Series[] {
  const xAccessor = makeAccessor(args.x);
  const yAccessor = makeAccessor(args.y);
  const pathOf = args.pathOf ?? linePathOf;

  return splitSeries(args.data, args.color, args.colorScale).map((group) => {
    const points: SeriesPoint[] = [];
    for (const datum of group.rows) {
      const px = positionOf(args.xScale, xAccessor(datum));
      const py = positionOf(args.yScale, yAccessor(datum));
      // Skip rows with missing or unmappable values on either positional channel.
      if (px === undefined || py === undefined) continue;
      points.push({ x: px, y: py, datum });
    }
    return {
      key: group.key,
      color: group.color,
      points,
      path: points.length > 0 ? pathOf(points) : '',
    };
  });
}

function linePathOf(points: ReadonlyArray<SeriesPoint>): string {
  const generator = d3Line<SeriesPoint>()
    .x((point) => point.x)
    .y((point) => point.y);
  return generator([...points]) ?? '';
}
