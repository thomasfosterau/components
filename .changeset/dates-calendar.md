---
'@thomasfosterau/components': minor
---

New `@thomasfosterau/components/dates` entry with `Calendar` and `RangeCalendar`, inline month grids on bits-ui for one date or a start–end range.

- Both take a `DateValue` from `@internationalized/date`. The entry re-exports `parseDate` and the `DateValue` type, so a caller converts at the edge: `parseDate('2026-10-23')` in, `value.toString()` out.
- Props: `minValue` / `maxValue`, `isDateDisabled`, `isDateUnavailable` (struck through as well as `aria-disabled`), `numberOfMonths`, `weekStartsOn`, `fixedWeeks`, `locales` (falls back to the context), a bindable `month` in view, `calendarLabel` / `previousLabel` / `nextLabel`, `disabled`, `readonly`, a `day` decoration snippet, and the `FieldControl` props. Inside a `FormField`, the calendar is labelled by the field's label.
- `RangeCalendar` adds `minDays`, `maxDays` and `excludeDisabled`.
- Neither is in the root barrel, so the date maths load only where they are imported.
