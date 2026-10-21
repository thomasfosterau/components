---
'@thomasfosterau/components': minor
---

`Combobox` can act as a search box, and the hotkeys family gets its own entry point.

- `postedValue: 'id' | 'query'` (default `'id'`). With `'query'`, `name` goes on the visible input, so a plain GET form posts the typed text with or without JavaScript, and Enter submits the form unless the reader arrowed to a suggestion.
- New props: `inputClass` (extra classes on the input, merged last), `initialQuery` (seeds the input text), `onQueryChange` (every keystroke), `onSelect` (the committed item), `hideLabel` (an `sr-only` label) and `portal` (default `true`; `false` keeps the listbox inside the component).
- The root `<div>` now spreads the remaining native attributes, such as `data-testid`.
- New `@thomasfosterau/components/hotkeys` export, so `HotkeyHelpDialog` can be imported lazily. The root barrel still re-exports the family.
