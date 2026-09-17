import type { Channel } from '@thomasfosterau/chart-spec';
import { makeAccessor } from '../accessor.ts';
import type { PositionalScale } from '../scale.ts';
import type { DataRows, ResolvedScale } from '../types.ts';
import { baselineOf, positionOf } from './position.ts';
import { colorOfDatum } from './series.ts';
import type { BarGeometry, BarRect } from './types.ts';

/**
 * Builds bar chart geometry. Bars grow from the zero baseline, so negative
 * values produce bars below it. Band x-scales give bars their bandwidth;
 * continuous x-scales get a derived width.
 */
export function buildBarGeometry(args: {
  readonly data: DataRows;
  readonly x: Channel;
  readonly y: Channel;
  readonly xScale: PositionalScale;
  readonly yScale: PositionalScale;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
}): BarGeometry {
  const xAccessor = makeAccessor(args.x);
  const yAccessor = makeAccessor(args.y);
  const baseline = baselineOf(args.yScale);
  const barWidth = barWidthOf(args.xScale, args.data.length);

  const bars: BarRect[] = [];
  for (const datum of args.data) {
    const xCenter = positionOf(args.xScale, xAccessor(datum));
    const yPosition = positionOf(args.yScale, yAccessor(datum));
    if (xCenter === undefined || yPosition === undefined) continue;

    bars.push({
      x: xCenter - barWidth / 2,
      y: Math.min(yPosition, baseline),
      width: barWidth,
      height: Math.abs(yPosition - baseline),
      color: colorOfDatum(datum, args.color, args.colorScale),
      datum,
    });
  }

  return { mark: 'bar', bars };
}

function barWidthOf(xScale: PositionalScale, count: number): number {
  if (xScale.kind === 'band') {
    return xScale.d3.bandwidth();
  }
  // Continuous x-scale: divide the range across the data with padding.
  const range = xScale.resolved.range as ReadonlyArray<number>;
  const extent = Math.abs(Math.max(...range) - Math.min(...range));
  return count > 0 ? Math.max(1, (extent / count) * 0.8) : 1;
}
