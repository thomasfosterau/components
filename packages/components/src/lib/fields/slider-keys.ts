/**
 * The Page Up / Page Down arithmetic behind `Slider`, which bits-ui 2.20's
 * thumb keyboard handler does not cover. Pure, so the component's key handler
 * stays a dispatch and the arithmetic is testable on its own.
 *
 * @module
 */

/** The scale a slider moves over: its bounds and its step (a number, or explicit snap points). */
export interface SliderScale {
  readonly min: number;
  readonly max: number;
  readonly step: number | readonly number[];
}

/** Index of the snap point nearest `value`. */
function nearestIndex(points: readonly number[], value: number): number {
  let best = 0;
  points.forEach((point, index) => {
    if (Math.abs(point - value) < Math.abs((points[best] ?? point) - value)) best = index;
  });
  return best;
}

/**
 * The value one page away from `current` in `direction` (`1` up, `-1` down):
 * a tenth of the scale, rounded to whole steps and never less than one. For
 * snap points, a tenth of the points, never less than one.
 */
export function pageStep(current: number, direction: 1 | -1, scale: SliderScale): number {
  const { min, max, step } = scale;
  if (typeof step === 'number') {
    return current + direction * step * Math.max(1, Math.round((max - min) / 10 / step));
  }
  const points = [...step].sort((a, b) => a - b);
  const jump = Math.max(1, Math.round(points.length / 10));
  const target = Math.min(
    points.length - 1,
    Math.max(0, nearestIndex(points, current) + direction * jump),
  );
  return points[target] ?? current;
}

/** Clamp `next` for thumb `index` between its neighbours (or the scale's ends), so thumbs never cross. */
export function clampToNeighbours(
  values: readonly number[],
  index: number,
  next: number,
  scale: SliderScale,
): number {
  const lower = values[index - 1] ?? scale.min;
  const upper = values[index + 1] ?? scale.max;
  return Math.min(upper, Math.max(lower, next));
}
