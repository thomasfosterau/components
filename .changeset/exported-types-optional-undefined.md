---
'@thomasfosterau/components': patch
'@thomasfosterau/components-mapbox': patch
---

Every optional property of the exported record and option types now accepts an explicit `undefined`, so a caller compiled with `exactOptionalPropertyTypes` can forward its own optional fields (`{ year: reference.year }`) instead of spreading them conditionally: `Citation`, `Footnote`, `TipConfig`, `TipState`, `TipStoreOptions`, `CanvasElement`, `Transform` and `HistoryEntry` in `@thomasfosterau/components`, the members of `setComponentsContext`'s argument, and `MapCamera`, `MapShape` and `StaticMapRequest` in `@thomasfosterau/components-mapbox`. An explicit `undefined` reads as absent, as omitting the field does. No runtime change.
