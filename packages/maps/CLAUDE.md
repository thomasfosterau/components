# packages/maps — the published maps package

`@thomasfosterau/components-maps`: five components that draw a map, plus the seam between a plan editor's shapes and a stored GeoJSON geometry. Everything in `src/lib/` ends up in `dist/` and on npm, by exactly the same `svelte-package` mechanism as the sibling — `svelte-kit sync` generates the ambient types, `svelte-package` copies `src/lib/` compiling nothing, the consumer's build compiles the `.svelte` files.

**Why it is its own package.** A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core library stays free of it. Here that dependency is `mapbox-gl` — ~800 kB of WebGL — and the split is what turns a fiction (an "optional" peer nothing in the workspace could check) into a fact: `mapbox-gl` is this package's **required** peer, installing this package IS the decision to render a map, and `@thomasfosterau/components` no longer mentions it at all.

The repo-wide authoring rules (runes and snippets only, attribute spreading, `class` merging, literal daisyUI lookup tables, bits-ui for interaction, ARIA as contract) live in the root [AGENTS.md](../../AGENTS.md); the sibling's package-level notes are in [packages/components/CLAUDE.md](../components/CLAUDE.md). This file carries what is specific to this package.

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/index.ts` | The package root barrel — `@thomasfosterau/components-maps` is a single entry point, not a family under one. |
| `src/lib/` | The components. **Everything under `src/lib/` ships** — `svelte-package` copies it verbatim. |
| `src/stories/` | Stories. Outside `src/lib/`, so they never ship — and rendered by the ONE Storybook in `packages/components`, whose `stories` glob reaches across (`../../maps/src/stories/**`). There is no `.storybook/` here. |
| `tests/` | The browser suite, one file per component. `tests/setup.ts` registers the jest-dom matchers; `tests/pointer.ts` is a copy of the sibling's helper (test helpers are not published, so there is nothing to import it from). |

Type-checked together: `tsconfig.json`'s `include` is `["src", "tests"]`.

## Import boundary

- **`@thomasfosterau/components` only, and only through its published entry points.** `MapEditor`, `MapShapeView`, `shapes.ts` and `geojson.ts` all reach the canvas toolkit as `@thomasfosterau/components/canvas` — never a relative path into the sibling's `src/`. It is a `workspace:*` dependency resolved through its `exports`, which point at its built `dist/`, exactly as a consumer resolves it.
- **That is why `check` and `test:unit` depend on `{ task: 'build', from: 'dependencies' }`** (see [vite.config.ts](vite.config.ts)). Neither the type-check nor the browser suite can resolve the sibling until its `svelte-package` build has run.
- **Nothing app-specific.** Same rule as the sibling: no `$app/*`, no `$env/*`, no global. `MapEditor` does not even read a Mapbox token — which is what keeps it working on a build with no Mapbox credential at all.

## Testing

Vitest browser mode, headless Chromium through Playwright — the sibling's [CLAUDE.md](../components/CLAUDE.md#testing) covers the mechanics (`render` is async, `expect.element` retries, `createRawSnippet` needs a single element, prefer accessible queries).

- **`mapbox-gl` is installed here, so the "unavailable" path has to be produced deliberately.** `tests/DynamicMap.test.ts` and `tests/Map.test.ts` each `vi.mock('mapbox-gl', …)` with a `Map` class whose **constructor throws** — the WebGL-unavailable case, landing on the same `catch` a missing engine or a 404'd bundle does. A factory that throws outright (modelling the module being absent) does **not** work in Vitest 4 browser mode: the mocker surfaces it as an unhandled rejection in the runner rather than as a rejected `import()` inside the component.
- **No test needs a token or a network.** Everything else here is geometry, URL construction, or SVG the editor draws; what the live map does once Mapbox loads is Mapbox's contract, not this package's, and is not asserted.
- **`mapbox-gl` is in `optimizeDeps.include`.** `DynamicMap` reaches it from a dynamic `import()` inside a mount effect, which is exactly the late discovery that makes Vite optimise mid-run and reload the page, failing every test in flight.

## Terms

- **Map editor vocabulary** (`shapes.ts`, `MapShapeView.svelte`, `geojson.ts`) —
  - **Shape**: an area (`polygon`, closed), a path (`line`, open) or a point (`marker`, a disc). All three sit at a `position` in canvas coordinates; an outline's `points` are relative to it, so moving a shape never rewrites its corners.
  - **Grip vs indicator**: `MapShapeView` draws a selected outline's vertices as filled grips when `editable` and as hollow rings otherwise — the affordance matches the capability, so a read-only plan never offers a handle that does nothing.
  - **Committed edit**: `MapEditor` reports every pointer move with `committed: false` and the release once with `committed: true`, carrying a `Transform` spanning the whole gesture. A page records history on `committed` alone, so one drag is one undo entry. History and shape creation stay with the page that owns the document; the editor keeps neither.
  - **Geo frame** (`geojson.ts`): how a stored GeoJSON geometry becomes canvas coordinates — subtract an origin, scale by a power of two, negate y. Chosen for exact invertibility, not looks (it is equirectangular, so a plan reads wider than it is away from the equator). A document in this frame wants `grid.snap: false`, or the grid quantises the boundary.

- **The engine is reached once, from one place.** `DynamicMap`'s mount effect is the only `import('mapbox-gl')` in the package, and the only side-effecting import (`mapbox-gl/dist/mapbox-gl.css`) with it. `"sideEffects": false` is a claim about `dist/` and it holds because both sit inside that effect — a top-level stylesheet import would make it false.
