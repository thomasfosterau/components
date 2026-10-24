---
'@thomasfosterau/components': minor
---

New `NumberField` field (`fields`): an exact number shown through `Intl.NumberFormat` (units, percent, currency, grouping) in the context's locale and parsed back in the same locale, with − / + stepper buttons — the APG spinbutton.

- `value` is a `number | undefined`; typed text is parsed on blur or Enter (`"1.234,5"` in `de-DE` is `1234.5`), clamped to `min` / `max`, rounded to the step's or the format's precision, and passed to `onCommit`. Unparseable text reverts; an empty field is `undefined`.
- `role="spinbutton"` with `aria-valuenow`, `aria-valuemin` / `aria-valuemax` and the formatted `aria-valuetext`; Arrow Up / Down ± `step`, Page Up / Down ± `largeStep`, Home / End to the bounds. The − / + buttons (`decrementLabel`, `incrementLabel`) stay out of the tab order, are disabled at the bounds and auto-repeat while held. No scroll-wheel handling.
- `name` posts the raw number through a hidden input, never the formatted text.
- The − / + buttons are sized from the shared `inputButtonSize` table.
