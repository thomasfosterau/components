---
'@thomasfosterau/components': minor
---

New `PinInput` field (`fields`): a fixed-length code — a sign-in code, a TOTP, an invite code — typed one character per visible cell into ONE real input, on bits-ui's `PinInput`, so paste, SMS autofill (`autocomplete="one-time-code"`), password managers and form posting treat it as one field.

- `length` (default 6), `charset` (`'numeric'` | `'alphanumeric'`, setting `inputmode` and the input's pattern), `masked` (bullets in the cells), `onComplete(code)`, `pasteTransformer` (default strips whitespace and hyphens, so "123 456" pastes as "123456"), `size`, and the `FieldControl` props on the real input.
- The cells are `aria-hidden` presentation; `FormField`'s label names the input.
- New `pinCellSize` class table in `fields/field-types.ts`.
