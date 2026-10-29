import type { Channel } from '../../spec/index.ts';
import { makeAccessor } from '../accessor.ts';
import type { PositionalScale } from '../scale.ts';
import type { DataRows, ResolvedScale } from '../types.ts';
import { baselineOf, positionOf } from './position.ts';
import { colorOfDatum } from './series.ts';
import type { BarGeometry, BarRect } from './types.ts';

/** What {@link buildBarGeometry} takes. */
interface BarArgs {
  readonly data: DataRows;
  readonly x: Channel;
  readonly y: Channel;
  readonly xScale: PositionalScale;
  readonly yScale: PositionalScale;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
  /** Spec 1.1: the end of a range on x; each bar spans `x` to `x2`. */
  readonly x2?: Channel | undefined;
  /** Spec 1.1: the end of a range on y; each bar spans `y` to `y2`. */
  readonly y2?: Channel | undefined;
}

/**
 * Builds bar chart geometry. Bars grow from the zero baseline, so negative
 * values produce bars below it. Band x-scales give bars their bandwidth;
 * continuous x-scales get a derived width. With a range channel (`x2` or
 * `y2`, spec 1.1) each bar spans from its start to its end instead: a
 * horizontal range bar (a Gantt row) for `x2`, a vertical one for `y2`.
 */
export function buildBarGeometry(args: BarArgs): BarGeometry {
  if (args.x2 !== undefined) return buildRangeBars(args, 'x', args.x2);
  if (args.y2 !== undefined) return buildRangeBars(args, 'y', args.y2);
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

/**
 * Range bars along `axis`: each spans the start channel's position to the
 * end channel's. An end before its start is normalised (the rect runs
 * between the two whichever comes first), so a reversed row still draws.
 * The other axis is the band each bar sits in.
 */
function buildRangeBars(args: BarArgs, axis: 'x' | 'y', end: Channel): BarGeometry {
  const along = axis === 'x' ? args.xScale : args.yScale;
  const across = axis === 'x' ? args.yScale : args.xScale;
  const startAccessor = makeAccessor(axis === 'x' ? args.x : args.y);
  const endAccessor = makeAccessor(end);
  const bandAccessor = makeAccessor(axis === 'x' ? args.y : args.x);
  const thickness = barWidthOf(across, args.data.length);

  const bars: BarRect[] = [];
  for (const datum of args.data) {
    const from = positionOf(along, startAccessor(datum));
    const to = positionOf(along, endAccessor(datum));
    const centre = positionOf(across, bandAccessor(datum));
    if (from === undefined || to === undefined || centre === undefined) continue;
    const low = Math.min(from, to);
    const length = Math.abs(to - from);
    const color = colorOfDatum(datum, args.color, args.colorScale);
    bars.push(
      axis === 'x'
        ? { x: low, y: centre - thickness / 2, width: length, height: thickness, color, datum }
        : { x: centre - thickness / 2, y: low, width: thickness, height: length, color, datum },
    );
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
