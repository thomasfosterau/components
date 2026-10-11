---
'@thomasfosterau/components': patch
'@thomasfosterau/components-mapbox': patch
---

Every component now carries a `<!-- @component -->` summary, so editors show it on hover, and its props carry doc comments, including `@defaultValue` wherever a default is set. Exported helpers and class tables that had no doc comment now have one. No API change.
