---
'@thomasfosterau/components': minor
---

New `PasswordInput` field (`fields`): a password field with a "Show password" toggle and an explicit `purpose` that sets `autocomplete` to `current-password` or `new-password`, so a password manager fills a sign-in form and offers to generate on a sign-up one.

- The toggle is a real `type="button"` (it never submits the form) with a constant accessible name, `showLabel`, and an `aria-pressed` state; it `aria-controls` the input, keeps focus, and keeps the input's selection across the type flip.
- `revealed` is bindable; `revealable={false}` drops the toggle; the field hides again when its form submits.
- `...rest` (`name`, `minlength`, `aria-*`, `data-*`) lands on the inner input, `class` on the wrapper, `inputClass` on the input.
- New `inputButtonSize` class table in `fields/field-types.ts`, for a button inside an `input` composite.
