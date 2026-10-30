---
'@thomasfosterau/components': patch
'@thomasfosterau/components-mapbox': patch
'@thomasfosterau/charts': patch
---

Drop the redundant `| undefined` the type-aware lint flagged on optional parameters and on `StaticMapRequest.overlay` (`unknown` already includes it), and quote the package names that opened the `@thomasfosterau/charts` entry modules' doc comments, which a JSDoc reader took for tags. The declared types are unchanged.
