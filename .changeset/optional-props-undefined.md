---
'@thomasfosterau/components': patch
'@thomasfosterau/components-maps': patch
---

Every optional component prop now accepts an explicit `undefined`, so a wrapper compiled with `exactOptionalPropertyTypes` can forward its own optional prop (`<NumberFormat {maximumFractionDigits}>`, `<DynamicMap {label}>`) instead of spreading it conditionally. An explicit `undefined` falls back to the prop's default, as omitting it does. No runtime change.
