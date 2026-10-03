# @thomasfosterau/components-maps

## 0.2.0

### Minor Changes

- bd7ecbd: Releases are published through npm Trusted Publishing (OIDC), from a protected `release` environment, instead of a long-lived `NPM_TOKEN`. The published tarballs are packed by pnpm, so `catalog:` and `workspace:*` specifiers resolve to real version ranges exactly as before; no change to either package's API.
- 5fbc916: New package: the maps family, split out of `@thomasfosterau/components` into a sibling of its own.

  A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core library stays free of it. Maps were the only family in the library with such a dependency — `mapbox-gl`, ~800 kB of WebGL — and it was carried as an "optional peer" of the whole library, a claim nothing in the workspace could check.

  - **Added** `@thomasfosterau/components-maps`, a single root entry point exporting `StaticMap`, `DynamicMap`, `Map`, `MapEditor` and `MapShapeView`, plus `staticMapUrl` and the GeoJSON ↔ canvas seam (`geoFrame`, `geometryFrame`, `canvasFromGeo`, `geoFromCanvas`, `geometryShapes`, `shapesGeometry`) and the shape geometry (`blankShape`, `dragShape`, `dragVertex`, `insertVertex`, `removeVertex`, `shapeAt`, `vertexAt`, …). The components, their props, their ARIA contracts and their behaviour are unchanged from `@thomasfosterau/components/maps`.
  - **`mapbox-gl` is now a REQUIRED peer** of this package rather than an optional peer of the core library. Installing this package is the decision to render a map. It is still reached only through `DynamicMap`'s dynamic `import()` inside a mount effect, so the engine lands in the chunk for the route that renders a live map and nowhere else.
  - **Depends on `@thomasfosterau/components`** for `MapEditor`'s pan/zoom/grid surface, reached through that package's published `/canvas` entry point.

  **Migrating:** `pnpm add @thomasfosterau/components-maps mapbox-gl`, change `@thomasfosterau/components/maps` to `@thomasfosterau/components-maps` at every import, and add `@source '…/node_modules/@thomasfosterau/components-maps/dist';` beside the existing `@source` line in your Tailwind entry. Nothing else changes.

### Patch Changes

- adc2b53: Every component now carries a `<!-- @component -->` summary, so editors show it on hover, and its props carry doc comments, including `@defaultValue` wherever a default is set. Exported helpers and class tables that had no doc comment now have one. No API change.
- Updated dependencies [adc2b53]
- Updated dependencies [5bdb819]
- Updated dependencies [8129ae0]
- Updated dependencies [bd7ecbd]
- Updated dependencies [5fbc916]
  - @thomasfosterau/components@0.2.0
