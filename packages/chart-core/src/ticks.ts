import type { PositionalScale } from './scale.ts';
import type { Tick } from './types.ts';

/** Default tick count for continuous scales. */
export const DEFAULT_TICK_COUNT = 5;

/**
 * Computes axis ticks for a positional scale.
 *
 * - Continuous scales (linear, UTC) use d3's tick generation and formatting.
 *   UTC formatting is deterministic across machines and time zones.
 * - Categorical scales (band, point) emit one tick per category, centred on
 *   the band.
 */
export function computeTicks(scale: PositionalScale, count: number = DEFAULT_TICK_COUNT): Tick[] {
  switch (scale.kind) {
    case 'linear': {
      const format = scale.d3.tickFormat(count);
      return scale.d3.ticks(count).map((value) => ({
        value,
        position: scale.d3(value),
        label: format(value),
      }));
    }
    case 'utc': {
      const format = scale.d3.tickFormat(count);
      return scale.d3.ticks(count).map((value) => ({
        value,
        position: scale.d3(value),
        label: format(value),
      }));
    }
    case 'band': {
      const bandwidth = scale.d3.bandwidth();
      return scale.d3.domain().map((value) => ({
        value,
        position: (scale.d3(value) ?? 0) + bandwidth / 2,
        label: value,
      }));
    }
    case 'point': {
      return scale.d3.domain().map((value) => ({
        value,
        position: scale.d3(value) ?? 0,
        label: value,
      }));
    }
  }
}
