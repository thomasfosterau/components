# @thomasfosterau/components

The core library. `svelte-package` copies `src/lib/` into `dist/` uncompiled; the consumer's build compiles it. Per-component API lives in doc comments, guides in [docs/](docs/), and the README is the short npm landing page.

## Boundary

- **`@thomasfosterau/effect-forms-svelte` is reachable only from the `./entity-form` entry**, which no barrel re-exports: it is an optional peer, and importing it anywhere else would make every consumer install it. `fallow-rules.json` enforces it.
- **`effect` is an optional peer**, today reached only from `./entity-form`. Other code may use it internally, but that makes it a required peer of that entry (say so in the changeset), and no Effect type reaches a prop or export (docs/CONTRIBUTING.md § Effect).
- **Nothing heavy on the root barrel.** `src/lib/index.ts` is loaded on every page of every consumer.
- **The public surface is `exports`**: the root barrel, `src/lib/<family>/index.ts` for `citations`, `canvas`, `charts`, `tips`, `seo` and `hotkeys`, `forms/entity-form.ts` and `theme.css`. Changing anything reachable from them needs a changeset.

## Invariants

- Stories (`src/stories/`) and tests (`tests/`) mirror `src/lib/<family>/` but live outside it, so they don't ship. Both are type-checked by `vp run check`.
- `theme.css` is reached through a CSS `@import`, never a JS import, which keeps `"sideEffects": false` true. It is the one copy of every token; `.storybook/preview.css` imports it, with daisyUI's built-in themes off (`themes: false`) because they share its theme names.
- Extend an existing primitive rather than adding a parallel one.

## Testing

Vitest browser mode in headless Chromium: focus order, keyboard handling and the accessibility tree need a real browser.

- `render` (from `vitest-browser-svelte`) is async: `await render(...)`.
- Assert through `expect.element(locator)`, which retries. Prefer role and label queries to test ids.
- A `.ts` test builds snippets with `createRawSnippet`, whose fragment must be a single element.
- Vitest's Playwright locator mutates the `position` you pass to `click` and friends; pass a fresh `{ x, y }` each call (`tests/canvas/pointer.ts`'s `copy`).

## Storybook

The one Storybook for the workspace; its `stories` glob also covers `packages/mapbox/src/stories`. It depends on this package's `build`, because the maps stories import `@thomasfosterau/components/canvas`. Stories use no app state, network or `localStorage`, and should have no outstanding a11y-panel violations.

## Terms

- **`FieldControl`**: the `{ id, labelId, describedBy, invalid, required }` object `FormField` / `Fieldset` hand their `children`; every control in `fields/` takes it by spread so label and control can't drift apart.
- **`ItemList` feed mode**: `feed` switches `<ul>` to an ARIA `feed` of `<article aria-posinset aria-setsize>`, for streams where only a window is in the DOM. `VirtualList`'s `semantics="feed"` is the same contract.
- **Chart palette**: four `--color-chart-*` properties, assigned by order and never cycled; see [docs/charts.md](docs/charts.md#chart-palette-rules).
- **Tip status vs frequency**: a `dismissed` or `completed` tip never shows again, whatever its `frequency`.
