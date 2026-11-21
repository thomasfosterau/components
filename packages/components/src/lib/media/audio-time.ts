/**
 * Time arithmetic and wording for `AudioPlayer`: the clock shown on screen
 * and the long form a screen reader hears.
 *
 * @module
 */

import { durationFromMilliseconds, formatDuration } from '../formatting/duration.ts';

/** `65` → `'1:05'`; `3725` → `'1:02:05'`. Non-finite or negative input reads `'0:00'`. */
export function formatClock(seconds: number): string {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = String(whole % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

/** `65` → `'1 minute, 5 seconds'` in `locales`, for `aria-valuetext`. Zero reads `'0 seconds'`. */
export function spokenTime(seconds: number, locales?: string | readonly string[]): string {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  return formatDuration(durationFromMilliseconds(whole * 1000), locales, 'long');
}

/** `time` held inside `[0, duration]`; an unknown duration bounds nothing above. */
export const clampTime = (time: number, duration: number): number =>
  Math.max(0, Number.isFinite(duration) && duration > 0 ? Math.min(duration, time) : time);
