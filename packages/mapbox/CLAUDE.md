# @thomasfosterau/components-mapbox

The maps package: components that draw a map, plus the seam between a plan editor's shapes and a stored GeoJSON geometry. It exists because of AGENTS.md's third-party-dependency rule: `mapbox-gl` is its required peer. It is built exactly like the sibling (`svelte-kit sync`, then `svelte-package` copying `src/lib/` into `dist/`); repo-wide authoring rules are in the root [AGENTS.md](../../AGENTS.md), the sibling's package notes in [packages/components/CLAUDE.md](../components/CLAUDE.md).

## Boundary

- **`@thomasfosterau/components` only, and only through its published entry points.** `MapEditor`, `MapShapeView`, `shapes.ts` and `geojson.ts` reach the canvas toolkit as `@thomasfosterau/components/canvas` — never a relative path into the sibling's `src/`. It is a `workspace:*` dependency resolved through its `exports`, which point at its built `dist/`, exactly as a consumer resolves it.
- **That is why `check` and `test:unit` depend on `{ task: 'build', from: 'dependencies' }`** (see [vite.config.ts](vite.config.ts)). Neither the type-check nor the browser suite can resolve the sibling until its `svelte-package` build has run.
- **No Mapbox token.** `MapEditor` does not read one, which keeps it working on a build with no Mapbox credential at all.

## Invariants

- **The engine is reached once, from one place.** `DynamicMap`'s mount effect is the only `import('mapbox-gl')` in the package, and the only side-effecting import (`mapbox-gl/dist/mapbox-gl.css`) sits with it.
- **`src/lib/index.ts` is the single entry point** — `@thomasfosterau/components-mapbox` has no subpath exports.
- **`tests/pointer.ts` is a copy of the sibling's `tests/canvas/pointer.ts`.** Test helpers are not published, so there is nothing to import it from; change both together.

## Testing

Vitest browser mode, headless Chromium through Playwright; the sibling's [CLAUDE.md](../components/CLAUDE.md#testing) covers the mechanics. Stories in `src/stories/` are rendered by the one Storybook in `packages/components`.

- **`mapbox-gl` is installed here, so the "unavailable" path has to be produced deliberately.** `tests/DynamicMap.test.ts` and `tests/Map.test.ts` each `vi.mock('mapbox-gl', …)` with a `Map` class whose **constructor throws** — the WebGL-unavailable case, landing on the same `catch` a missing engine or a 404'd bundle does. A factory that throws outright (modelling the module being absent) does **not** work in Vitest browser mode: the mocker surfaces it as an unhandled rejection in the runner rather than as a rejected `import()` inside the component.
- **No test needs a token or a network.** Everything else here is geometry, URL construction, or SVG the editor draws; what the live map does once Mapbox loads is Mapbox's contract, not this package's, and is not asserted.
- **`mapbox-gl` is in `optimizeDeps.include`.** `DynamicMap` reaches it from a dynamic `import()` inside a mount effect, which is exactly the late discovery that makes Vite optimise mid-run and reload the page, failing every test in flight.

## Terms

Map editor vocabulary (shape, grip vs indicator, committed edit, geo frame): see [README § Map editor vocabulary](README.md#map-editor-vocabulary).
