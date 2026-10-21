import type { Channel } from '../../spec/index.ts';
import { makeAccessor } from '../accessor.ts';
import { DEFAULT_POINT_RADIUS, type PositionalScale } from '../scale.ts';
import type { DataRows, ResolvedScale } from '../types.ts';
import { positionOf } from './position.ts';
import { colorOfDatum } from './series.ts';
import type { PointCircle, PointGeometry } from './types.ts';

/** Builds scatter/point chart geometry: one circle per datum. */
export function buildPointGeometry(args: {
  readonly data: DataRows;
  readonly x: Channel;
  readonly y: Channel;
  readonly xScale: PositionalScale;
  readonly yScale: PositionalScale;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
  readonly size?: Channel | undefined;
  readonly sizeScale?: ResolvedScale | undefined;
}): PointGeometry {
  const xAccessor = makeAccessor(args.x);
  const yAccessor = makeAccessor(args.y);
  const sizeAccessor = args.size ? makeAccessor(args.size) : undefined;

  const points: PointCircle[] = [];
  for (const datum of args.data) {
    const cx = positionOf(args.xScale, xAccessor(datum));
    const cy = positionOf(args.yScale, yAccessor(datum));
    if (cx === undefined || cy === undefined) continue;

    points.push({
      cx,
      cy,
      r: radiusOf(datum, sizeAccessor, args.sizeScale),
      color: colorOfDatum(datum, args.color, args.colorScale),
      datum,
    });
  }

  return { mark: 'point', points };
}

function radiusOf(
  datum: Parameters<ReturnType<typeof makeAccessor>>[0],
  sizeAccessor: ReturnType<typeof makeAccessor> | undefined,
  sizeScale: ResolvedScale | undefined,
): number {
  if (!sizeAccessor || !sizeScale) return DEFAULT_POINT_RADIUS;
  const value = sizeAccessor(datum);
  if (value === null) return DEFAULT_POINT_RADIUS;
  const radius = sizeScale.apply(value);
  return typeof radius === 'number' ? radius : DEFAULT_POINT_RADIUS;
}
