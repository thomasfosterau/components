import type { FieldValue } from '../accessor.ts';
import type { PositionalScale } from '../scale.ts';

/**
 * Maps a typed field value to a plot pixel position.
 *
 * Band scales position at the band centre; other scales map directly.
 * Returns undefined for missing values or values outside a categorical domain.
 */
export function positionOf(scale: PositionalScale, value: FieldValue): number | undefined {
  if (value === null) return undefined;
  switch (scale.kind) {
    case 'linear':
      return typeof value === 'number' ? scale.d3(value) : undefined;
    case 'utc':
      return value instanceof Date ? scale.d3(value) : undefined;
    case 'band': {
      const start = scale.d3(asCategory(value));
      return start === undefined ? undefined : start + scale.d3.bandwidth() / 2;
    }
    case 'point':
      return scale.d3(asCategory(value));
  }
}

/**
 * The pixel position of the zero baseline for a y scale, clamped to the plot.
 * Non-linear y scales (temporal/categorical) baseline at the bottom of the range.
 */
export function baselineOf(scale: PositionalScale): number {
  const range = scale.resolved.range as ReadonlyArray<number>;
  const lo = Math.min(...range);
  const hi = Math.max(...range);
  if (scale.kind === 'linear') {
    return Math.min(Math.max(scale.d3(0), lo), hi);
  }
  return hi;
}

function asCategory(value: NonNullable<FieldValue>): string {
  return typeof value === 'string' ? value : String(value);
}
