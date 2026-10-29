/**
 * `@thomasfosterau/components/dates` — the bits-ui date controls, behind
 * their own entry.
 *
 * They bring bits-ui's calendar state machines and `@internationalized/date`'s
 * calendar maths, so they are not re-exported from the root barrel or from
 * `fields`: the separate entry makes that cost visible at the import site,
 * lets an app `import()` them lazily on the one page that needs them, and
 * keeps any always-loaded component from pulling them in by accident (the
 * #129 failure mode). `DateInput`, the native control, stays in the barrel
 * and remains the default for a single date on a form.
 *
 * `parseDate` and the `DateValue` type are re-exported so a caller converts
 * at the edge without a direct dependency: `parseDate('2026-10-23')` in,
 * `value.toString()` (ISO `YYYY-MM-DD`) out.
 *
 * @module
 */

export { default as Calendar } from './Calendar.svelte';
export { default as RangeCalendar } from './RangeCalendar.svelte';
export type { CalendarBaseProps } from './calendar-props.ts';
export { parseDate, type DateValue } from '@internationalized/date';
