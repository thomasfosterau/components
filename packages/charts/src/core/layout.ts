import type { Box, Dimensions, Margins } from './types.ts';

/** Default margins, leaving room for axis ticks and labels. */
export const DEFAULT_MARGINS: Margins = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 48,
};

/**
 * Computes chart dimensions from an outer box and optional margin overrides.
 *
 * Missing margins take their {@link DEFAULT_MARGINS} value. The plot area
 * never goes negative: its width and height are clamped at zero, while the
 * margins are kept as given.
 */
export function computeDimensions(outer: Box, margins?: Partial<Margins>): Dimensions {
  const resolved: Margins = { ...DEFAULT_MARGINS, ...margins };
  const plot: Box = {
    width: Math.max(0, outer.width - resolved.left - resolved.right),
    height: Math.max(0, outer.height - resolved.top - resolved.bottom),
  };
  return { outer, margins: resolved, plot };
}
