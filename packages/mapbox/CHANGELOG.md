# @thomasfosterau/components-mapbox

## 0.2.0

### Minor Changes

- b160b83: `MapEditor` has a keyboard path to every pointer edit (#135, upstreamed from the owner's app). `]` / `[` step between shapes and, inside a shape, between its vertices and edge midpoints. Arrows move the shape or vertex a grid step, five with Shift; on a midpoint they add a vertex and move it. Enter / Space go into a shape's handles or add a vertex at a midpoint. Delete / Backspace remove a vertex. Escape steps back out, and with a drawing tool it finishes the outline at once. With a drawing tool, a cursor moved by the arrows places vertices on Enter. A held arrow is one undo step, with the same transform the matching pointer drag commits. The focused part is named through `aria-activedescendant`, and edits are announced in a polite status region.

  The copy is new props with English defaults: `keysDescription`, `shapeLabel`, `vertexLabel`, `midpointLabel`, `cursorLabel` and the `…Message` announcements. Coordinates are formatted with the new `locales` prop. `MapShapeView` gains `focus`, `focusId`, `focusLabel` and `focusVisible`.

  Also fixed: switching tool mid-outline now finishes the outline straight away instead of on the next press, and an Alt-click refused by the minimum-vertex rule no longer reports a no-op committed edit.

### Patch Changes

- bbabaef: Doc comments: every export's first sentence now stands alone in a hover, `MapShapeView`'s `selected` / `editable` state their `false` default, and `Map`'s `width` says it sizes the raster while the live map fills its container. The README is now a full API reference (shape geometry, the GeoJSON seam, static map URLs, every type), and its peer range and defaults match the source.
- 859327d: `package.json`'s `repository.directory` now names `packages/mapbox`, the directory the package actually lives in; it named one that does not exist.
- d729e10: Drop the redundant `| undefined` the type-aware lint flagged on optional parameters and on `StaticMapRequest.overlay` (`unknown` already includes it), and quote the package names that opened the `@thomasfosterau/charts` entry modules' doc comments, which a JSDoc reader took for tags. The declared types are unchanged.
- Updated dependencies [b160b83]
- Updated dependencies [f76d83f]
- Updated dependencies [bbabaef]
- Updated dependencies [9ced607]
- Updated dependencies [ce08e97]
- Updated dependencies [5da5d9e]
- Updated dependencies [d1ec8d4]
- Updated dependencies [fc2aca9]
- Updated dependencies [bbbd37f]
- Updated dependencies [1db2d3d]
- Updated dependencies [021f9e7]
- Updated dependencies [bbabaef]
- Updated dependencies [1de9ef8]
- Updated dependencies [0e6558e]
- Updated dependencies [fcd0f37]
- Updated dependencies [a2778bc]
- Updated dependencies [12d015e]
- Updated dependencies [1d66b79]
- Updated dependencies [3f71b80]
- Updated dependencies [088ea40]
- Updated dependencies [63b3124]
- Updated dependencies [5ad51fa]
- Updated dependencies [0741231]
- Updated dependencies [38f0c1c]
- Updated dependencies [42acc6a]
- Updated dependencies [6e647d0]
- Updated dependencies [8017613]
- Updated dependencies [123af69]
- Updated dependencies [d729e10]
- Updated dependencies [7343c77]
- Updated dependencies [1f00aaa]
- Updated dependencies [fcacde9]
- Updated dependencies [7df9874]
- Updated dependencies [e37a373]
- Updated dependencies [e930050]
  - @thomasfosterau/components@0.2.0

## 0.1.0

### Minor Changes

- bd7ecbd: Releases are published through npm Trusted Publishing (OIDC), from a protected `release` environment, instead of a long-lived `NPM_TOKEN`. The published tarballs are packed by pnpm, so `catalog:` and `workspace:*` specifiers resolve to real version ranges exactly as before; no change to either package's API.
- 08e02ed: Both packages declare the `svelte` peer as `^5.40.0` (raised from the unreleased `^5.30.1`). `@thomasfosterau/effect-forms-svelte@0.2.0`, the optional peer behind the `@thomasfosterau/components/entity-form` entry, declares `svelte` `^5.40.0`, so 5.40.0 was already the real floor for any consumer of that entry; both packages now declare it, so they stay on one floor. A consumer on svelte older than 5.40 gets a peer warning (or an install error under `strict-peer-dependencies`) and should upgrade svelte. No API change.
- 5fbc916: New package: the maps family, split out of `@thomasfosterau/components` into a sibling of its own.

  A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core library stays free of it. Maps were the only family in the library with such a dependency — `mapbox-gl`, ~800 kB of WebGL — and it was carried as an "optional peer" of the whole library, a claim nothing in the workspace could check.

  - **Added** `@thomasfosterau/components-mapbox`, a single root entry point exporting `StaticMap`, `DynamicMap`, `Map`, `MapEditor` and `MapShapeView`, plus `staticMapUrl` and the GeoJSON ↔ canvas seam (`geoFrame`, `geometryFrame`, `canvasFromGeo`, `geoFromCanvas`, `geometryShapes`, `shapesGeometry`) and the shape geometry (`blankShape`, `dragShape`, `dragVertex`, `insertVertex`, `removeVertex`, `shapeAt`, `vertexAt`, …). The components, their props, their ARIA contracts and their behaviour are unchanged from `@thomasfosterau/components/maps`.
  - **`mapbox-gl` is now a REQUIRED peer** of this package rather than an optional peer of the core library. Installing this package is the decision to render a map. It is still reached only through `DynamicMap`'s dynamic `import()` inside a mount effect, so the engine lands in the chunk for the route that renders a live map and nowhere else.
  - **Depends on `@thomasfosterau/components`** for `MapEditor`'s pan/zoom/grid surface, reached through that package's published `/canvas` entry point.

  **Migrating:** `pnpm add @thomasfosterau/components-mapbox mapbox-gl`, change `@thomasfosterau/components/maps` to `@thomasfosterau/components-mapbox` at every import, and add `@source '…/node_modules/@thomasfosterau/components-mapbox/dist';` beside the existing `@source` line in your Tailwind entry. Nothing else changes.

### Patch Changes

- adc2b53: Every component now carries a `<!-- @component -->` summary, so editors show it on hover, and its props carry doc comments, including `@defaultValue` wherever a default is set. Exported helpers and class tables that had no doc comment now have one. No API change.
- 4443925: Every optional property of the exported record and option types now accepts an explicit `undefined`, so a caller compiled with `exactOptionalPropertyTypes` can forward its own optional fields (`{ year: reference.year }`) instead of spreading them conditionally: `Citation`, `Footnote`, `TipConfig`, `TipState`, `TipStoreOptions`, `CanvasElement`, `Transform` and `HistoryEntry` in `@thomasfosterau/components`, the members of `setComponentsContext`'s argument, and `MapCamera`, `MapShape` and `StaticMapRequest` in `@thomasfosterau/components-mapbox`. An explicit `undefined` reads as absent, as omitting the field does. No runtime change.
- 2493b82: Every optional prop these packages declare now accepts an explicit `undefined`, so a wrapper compiled with `exactOptionalPropertyTypes` can forward its own optional prop (`<NumberFormat {maximumFractionDigits}>`, `<DynamicMap {label}>`) instead of spreading it conditionally. An explicit `undefined` falls back to the prop's default, as omitting it does. No runtime change.
- Updated dependencies [adc2b53]
- Updated dependencies [5bdb819]
- Updated dependencies [4443925]
- Updated dependencies [8129ae0]
- Updated dependencies [bd7ecbd]
- Updated dependencies [2493b82]
- Updated dependencies [5fbc916]
- Updated dependencies [08e02ed]
  - @thomasfosterau/components@0.1.0
