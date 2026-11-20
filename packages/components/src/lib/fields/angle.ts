/**
 * `AngleSlider`'s arithmetic: pointer position to angle and back, stepping
 * with wrap, snapping, and compass names. Angles run clockwise in screen
 * space whatever the text direction, as a compass does. Pure, so each is
 * tested without a browser.
 *
 * @module
 */

/** Where 0° points: up (a compass bearing) or right (a maths angle, still clockwise on screen). */
export type AngleZero = 'north' | 'east';

/** The range an angle slider moves over. */
export interface AngleScale {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Stepping past one end continues from the other. */
  readonly wrap: boolean;
}

/** `degrees` folded into `[0, 360)`. */
export const normalise = (degrees: number): number => ((degrees % 360) + 360) % 360;

/** The angle of a point relative to the dial's centre (`dy` down, as on screen). */
export const pointToAngle = (dx: number, dy: number, zero: AngleZero): number => {
  const radians = zero === 'north' ? Math.atan2(dx, -dy) : Math.atan2(dy, dx);
  return normalise((radians * 180) / Math.PI);
};

/** A point on a circle of `radius` at `degrees`, relative to the centre (`y` down). */
export const angleToPoint = (
  degrees: number,
  zero: AngleZero,
  radius: number,
): { readonly x: number; readonly y: number } => {
  const radians = ((degrees + (zero === 'north' ? -90 : 0)) * Math.PI) / 180;
  return { x: radius * Math.cos(radians), y: radius * Math.sin(radians) };
};

/** The circular distance between two angles. */
const apart = (a: number, b: number): number => {
  const difference = Math.abs(normalise(a) - normalise(b));
  return Math.min(difference, 360 - difference);
};

/** `value` rounded to whole steps from `min` and kept in range. */
export const snapToStep = (value: number, scale: AngleScale): number => {
  const stepped = scale.min + Math.round((value - scale.min) / scale.step) * scale.step;
  // Steps that don't divide the range evenly would otherwise leave float dust.
  const rounded = Math.round(stepped * 1e6) / 1e6;
  return Math.min(scale.max, Math.max(scale.min, rounded));
};

/** The mark nearest `value`, measured round the circle. */
export const nearestMark = (value: number, marks: readonly number[]): number =>
  marks.reduce(
    (best, mark) => (apart(mark, value) < apart(best, value) ? mark : best),
    marks[0] ?? value,
  );

/**
 * The value for a pointer at dial angle `angle`. Inside the range it is the
 * angle itself; outside, the nearer end, round the circle. A full-circle
 * range maps 0° to `min`.
 */
export const angleToValue = (angle: number, scale: AngleScale): number => {
  const { min, max } = scale;
  if (max - min >= 360) return snapToStep(min + normalise(angle - min), scale);
  const inRange = normalise(angle - min) <= max - min;
  if (inRange) return snapToStep(min + normalise(angle - min), scale);
  return apart(angle, min) <= apart(angle, max) ? min : max;
};

/** `value` moved by `delta`: clamped, or carried round when `wrap`. */
export const stepBy = (value: number, delta: number, scale: AngleScale): number => {
  const { min, max, wrap } = scale;
  const next = value + delta;
  if (!wrap) return Math.min(max, Math.max(min, next));
  const span = max - min;
  return snapToStep(min + ((((next - min) % span) + span) % span), scale);
};

/** Eight compass point names, from north clockwise. */
export const compass8 = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
] as const;

/** Sixteen compass point names, from north clockwise. */
export const compass16 = [
  'north',
  'north-north-east',
  'north-east',
  'east-north-east',
  'east',
  'east-south-east',
  'south-east',
  'south-south-east',
  'south',
  'south-south-west',
  'south-west',
  'west-south-west',
  'west',
  'west-north-west',
  'north-west',
  'north-north-west',
] as const;

/** The compass point nearest a bearing, from `names` (north first, clockwise, evenly spaced). */
export const compassName = (bearing: number, names: readonly string[]): string => {
  const sector = 360 / names.length;
  return names[Math.round(normalise(bearing) / sector) % names.length] ?? '';
};
