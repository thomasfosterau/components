---
'@thomasfosterau/components': minor
---

`TextInput` takes `prefix` / `suffix` (non-editable text read as part of the field's description, never its value) and `leading` / `trailing` snippets, which put the input in daisyUI's composite `input` wrapper (the wrapper then takes `class`); `TextInput` and `Textarea` take `showCount` (with `maxlength`), `countLabel`, `countWarnAt` and `remainingLabel` for a "42 / 280" counter announced politely as the limit nears; `Textarea` takes `autoGrow` with `minRows` / `maxRows`. `SearchInput` is now built on `TextInput`. `TextInput` no longer accepts the RDFa `prefix` attribute, whose name `prefix` now takes.
