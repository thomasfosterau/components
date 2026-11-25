---
'@thomasfosterau/components-mapbox': minor
'@thomasfosterau/components-import': minor
---

`@thomasfosterau/components` is now a required peer (`^` the minor released alongside) instead of an exact-version dependency. Apps no longer get a second, nested copy of the library, so `getComponentsContext()` inside a map or the import mapper reads the context the app set. Add `@thomasfosterau/components` to your app's dependencies if it isn't there already.
