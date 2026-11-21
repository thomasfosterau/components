---
'@thomasfosterau/components': minor
---

Add `MaskedInput`: a `TextInput` that formats structured values as they are typed, with literals shown only once earned, the caret kept through mid-string edits, Backspace and Delete stepping over separators, paste stripped to raw, a wrong-kind keystroke announced once, and `formatOn="blur"`. Posts the raw value under `name` (or the formatted one with `submitFormatted`). Also exports `maskPresets` (`auMobile`, `auPostcode`, `card`, `isoDate`), `cardBrand`, `luhnValid` and the `Mask` and `MaskPreset` types.
