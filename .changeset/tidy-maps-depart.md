---
'@thomasfosterau/components-mapbox': minor
---

New package: the maps family, split out of `@thomasfosterau/components` into a sibling of its own.

A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core library stays free of it. Maps were the only family in the library with such a dependency — `mapbox-gl`, ~800 kB of WebGL — and it was carried as an "optional peer" of the whole library, a claim nothing in the workspace could check.

- **Added** `@thomasfosterau/components-mapbox`, a single root entry point exporting `StaticMap`, `DynamicMap`, `Map`, `MapEditor` and `MapShapeView`, plus `staticMapUrl` and the GeoJSON ↔ canvas seam (`geoFrame`, `geometryFrame`, `canvasFromGeo`, `geoFromCanvas`, `geometryShapes`, `shapesGeometry`) and the shape geometry (`blankShape`, `dragShape`, `dragVertex`, `insertVertex`, `removeVertex`, `shapeAt`, `vertexAt`, …). The components, their props, their ARIA contracts and their behaviour are unchanged from `@thomasfosterau/components/maps`.
- **`mapbox-gl` is now a REQUIRED peer** of this package rather than an optional peer of the core library. Installing this package is the decision to render a map. It is still reached only through `DynamicMap`'s dynamic `import()` inside a mount effect, so the engine lands in the chunk for the route that renders a live map and nowhere else.
- **Depends on `@thomasfosterau/components`** for `MapEditor`'s pan/zoom/grid surface, reached through that package's published `/canvas` entry point.

**Migrating:** `pnpm add @thomasfosterau/components-mapbox mapbox-gl`, change `@thomasfosterau/components/maps` to `@thomasfosterau/components-mapbox` at every import, and add `@source '…/node_modules/@thomasfosterau/components-mapbox/dist';` beside the existing `@source` line in your Tailwind entry. Nothing else changes.
