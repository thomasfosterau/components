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
 * `parseDate`, `parseTime`, `Time` and the `DateValue` type are re-exported
 * so a caller converts at the edge without a direct dependency:
 * `parseDate('2026-10-23')` / `parseTime('14:30')` in, `value.toString()`
 * (ISO) out.
 *
 * @module
 */

export { default as Calendar } from './Calendar.svelte';
export { default as DateField } from './DateField.svelte';
export { default as RangeCalendar } from './RangeCalendar.svelte';
export { default as TimeField } from './TimeField.svelte';
export type { CalendarBaseProps } from './calendar-props.ts';
export type { SegmentedFieldProps, TimeValue } from './segmented-field.ts';
export { parseDate, parseTime, Time, type DateValue } from '@internationalized/date';
