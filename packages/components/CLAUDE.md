# packages/components — the published library

Everything in this package ends up in `dist/` and on npm. It is a `svelte-package` library: `svelte-kit sync` generates the ambient types, `svelte-package` copies `src/lib/` into `dist/` compiling nothing, and the consumer's build compiles the `.svelte` files. The repo-wide authoring rules (runes and snippets only, attribute spreading, `class` merging with clsx, literal daisyUI lookup tables, bits-ui for interaction, ARIA as contract) live in the root [AGENTS.md](../../AGENTS.md); this file carries what is specific to the package.

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/index.ts` | The barrel. Every public component is exported here, and only from here. |
| `src/lib/<group>/` | The components. **Everything under `src/lib/` ships** — `svelte-package` copies it verbatim. |
| `src/lib/theme.css` | The design tokens, exported as `./theme.css`. |
| `src/stories/<group>/` | Stories, mirroring `src/lib/<group>/`. Outside `src/lib/`, so they never ship. |
| `tests/` | The browser suite. One file per group; `tests/setup.ts` registers the jest-dom matchers. |
| `.storybook/` | Storybook 10 config. `preview.css` is the only place the Tailwind + daisyUI stack is built here. |

Type-checked together: `tsconfig.json`'s `include` is `["src", "tests", ".storybook"]`, so a broken story or test fails `vp run check` exactly like a broken component does.

## Design tokens

[`src/lib/theme.css`](src/lib/theme.css) declares the `light` / `dark` daisyUI themes, and BOTH consumers import it — an application through the package's `./theme.css` export, Storybook's `.storybook/preview.css` relatively — so there is exactly one copy of every token. The values are deliberately neutral (achromatic surfaces, one slate brand hue): this library ships a _starting point_, not a brand, and a consumer is expected to redeclare the two themes.

`@plugin "daisyui" { themes: false; }` in `preview.css` is load-bearing: daisyUI's built-in themes are also called `light` and `dark`, and enabling both sets means two definitions of each fighting over the cascade.

## Testing

Vitest **browser mode**, headless Chromium through Playwright — not a DOM shim. This library's contract is focus order, keyboard handling and the accessibility tree, and happy-dom/jsdom model none of those faithfully enough to be evidence.

- `render` comes from `vitest-browser-svelte` and is **async** — `await render(...)`, or every locator call lands on a `Promise`.
- Assertions go through `expect.element(locator)`, which retries; the matchers are `@testing-library/jest-dom`'s.
- A `.ts` test has no template to declare a snippet in. Use Svelte's `createRawSnippet`, whose fragment must be a **single element** (wrap bare text in a `<span>`).
- Prefer accessible queries — `getByRole`, `getByLabelText`, `getByText` — over test ids. A test that can only find the element by `data-testid` is not testing the thing the component promises.

The browser binary is resolved by Playwright from `PLAYWRIGHT_BROWSERS_PATH`, and the catalog pins `playwright` to the release whose Chromium revision the session image carries. See that catalog entry before bumping it.

## Storybook

`vp run --filter ./packages/components storybook` (dev, port 6006) and `storybook:build`. Deliberately **outside** the `check` graph: the stories are type-checked by `check` (they are `src/` files), but rendering them is a review affordance, not a gate. The a11y addon is installed — a story with outstanding violations in that panel is not ready for review.

A story must not depend on anything the consumer would not have: no app state, no network, no `localStorage` writes (the next reviewer inherits them).

## Local invariants

- **Stay app-agnostic.** Nothing here may import `$app/*`, `$env/*`, or reach for a global. A component that needs one piece of application behaviour takes it as a prop.
- **Refine, don't redesign.** Extend an existing primitive rather than adding a parallel one; a new one-off component is usually a sign the shared primitive needs a prop.
- **`"sideEffects": false`.** `exports` points at `svelte-package` output, so the field is a claim about `dist/`: every emitted `.js` is pure declarations. `theme.css` is reached through a CSS `@import`, never a JS import, which is why the claim holds despite a stylesheet being in the package.
- **Nothing heavy on the always-loaded path.** The barrel is imported by every consumer on every page. A dependency the barrel pulls in eagerly needs a better reason than convenience — reach it through a dynamic `import()` inside the one component that needs it, and declare it an optional peer.
- **The public surface is the barrel.** A component not exported from `src/lib/index.ts` is an implementation detail; a component exported from it is a semver commitment and needs a changeset to change.

## Terms

- **`FieldControl`** — the `{ id, describedBy, invalid, required }` object `fields/FormField` (or `fields/Fieldset`) derives from a single `id` and hands its `children` snippet. Every control in `fields/` accepts it by spread — `<TextInput {...control} bind:value />` — so `for`/`id`, `aria-describedby`, `aria-invalid` and `required` cannot drift apart between the label and the control. Declared in `fields/field-types.ts`.

- **`ItemList` feed mode** — `data/ItemList`'s `feed?` prop switches its wrapper from `<ul>`/`<li>` (the default, where the list structure alone is the semantics) to `<div role="feed" aria-label aria-busy>` of `<article aria-posinset aria-setsize tabindex="-1">`. Feed mode is for a stream where only a window is ever in the DOM (infinite scroll, "load more") — `aria-posinset`/`aria-setsize` state each item's position in the whole even though the DOM only holds a slice, and `busy` reflects a fetch in flight for more. Use the default `<ul>` mode for a list that is entirely in the DOM at once.

- **Chart palette rules** (`theme.css`'s "Categorical chart slots" block, `charts/Chart.svelte`) — four validated custom properties, `--color-chart-1…4`, assigned to series by ORDER and never cycled:
  - **Order is the safety mechanism.** The separation gates are measured on ADJACENT pairs — what a line, bar or stack actually puts side by side. Re-ordering the slots invalidates the measurement: slots 2 and 4 (indigo/blue) are ΔE 2.7 apart in light and 0.4 in dark under simulated dichromacy, i.e. no colour difference at all for that reader if put next to each other.
  - **Four is the cap; three is the cap for a form that compares every pair at once** (a scatter, a choropleth, a pie), where even the best-separated pair (1↔3) falls to ΔE 4.9 under protanopia. A fifth series is a design problem — fold it into "other", or facet — never a generated hue; `Chart` draws a fifth in `--color-neutral` and names it in the legend.
  - **Status colours are not series colours.** Slot 3 is amber-600, not the amber-500 that IS `--color-warning` — a series can never impersonate a state.
  - This is why `Chart`'s `sr-only` data table is always in the DOM regardless of `showTable`: colour is the fast path, never the only one. A consumer replacing `theme.css`'s two themes must replace all four chart slots with their own measured set, in the same order.

- **Map editor vocabulary** (`maps/shapes.ts`, `maps/MapShapeView.svelte`, `maps/geojson.ts`) —
  - **Shape**: an area (`polygon`, closed), a path (`line`, open) or a point (`marker`, a disc). All three sit at a `position` in canvas coordinates; an outline's `points` are relative to it, so moving a shape never rewrites its corners.
  - **Grip vs indicator**: `MapShapeView` draws a selected outline's vertices as filled grips when `editable` and as hollow rings otherwise — the affordance matches the capability, so a read-only plan never offers a handle that does nothing.
  - **Committed edit**: `MapEditor` reports every pointer move with `committed: false` and the release once with `committed: true`, carrying a `Transform` spanning the whole gesture. A page records history on `committed` alone, so one drag is one undo entry. History and shape creation stay with the page that owns the document; the editor keeps neither.
  - **Geo frame** (`maps/geojson.ts`): how a stored GeoJSON geometry becomes canvas coordinates — subtract an origin, scale by a power of two, negate y. Chosen for exact invertibility, not looks (it is equirectangular, so a plan reads wider than it is away from the equator). A document in this frame wants `grid.snap: false`, or the grid quantises the boundary.

- **Tip store frequency vs. status** (`tips/tip-store.svelte.ts`) — `shouldDisplay` checks `TipStatus` before it checks `TipFrequency`: a tip in status `dismissed` or `completed` never shows again regardless of `frequency`, even `'immediate'`. `dismiss(id)` and `complete(id)` are both terminal — the distinction is for the app's own read of `getState`, not for `shouldDisplay`'s behaviour, which treats them identically. Frequency (`immediate`/`hourly`/`daily`/`weekly`/`once`) only gates re-display for a tip that is still in `pending`/`available`.

- **Absent-optional-peer resolution** (`vite.config.ts`'s `absentOptionalPeers` plugin) — `mapbox-gl` is a real optional peer of the published package but is deliberately NOT installed in this repo's own `devDependencies` (taking ~800 kB of WebGL to type-check one component would make "optional" a fiction nobody could check). Vite would otherwise fail hard resolving `maps/DynamicMap.svelte`'s dynamic `import('mapbox-gl')` at transform time, taking down the browser suite and Storybook. The plugin answers both `mapbox-gl` and `mapbox-gl/dist/mapbox-gl.css` with a module that throws when evaluated, so the component follows exactly the path it follows in a consumer that never installed the peer (the `catch`, and `unavailableLabel`). It is a dev/test/Storybook-only resolution — `svelte-package` copies source and bundles nothing, so a real consumer's own bundler resolves `mapbox-gl` for real.

- **Two test-infra gotchas the implementing agents hit:**
  - **Vitest's Playwright locator mutates the `position` object you pass it.** `locator.click({ position })` (and `dblclick`/`dropTo`) scale `position` into page pixels by mutating the object in place, so a point a spec declares once as a constant and reuses is a different point the second time — it fails quietly (the first use is correct, later ones drift by the iframe's scale). `tests/canvas/pointer.ts`'s `copy(at)` exists for this: always pass a fresh `{ x, y }` per call, never the same object twice.
  - **`render(Component, props)` cannot take a prop literally named `anchor`, `target`, `props`, `events`, `context` or `intro`** — those are Svelte's own mount options and are intercepted before your props are. Nest a real prop of one of those names under `props:` instead. (Also stated in the root [AGENTS.md](../../AGENTS.md), restated here because it is this package's tests that hit it.)
