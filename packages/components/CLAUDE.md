# @thomasfosterau/components

The core library: everything under `src/lib/` ends up in `dist/` and on npm. `svelte-kit sync` generates the ambient types, `svelte-package` copies `src/lib/` into `dist/` compiling nothing, and the consumer's build compiles the `.svelte` files. Repo-wide authoring rules are in the root [AGENTS.md](../../AGENTS.md).

## Boundary

- **`effect` and `@thomasfosterau/effect-forms-svelte` are reachable from one file.** `forms/EntityForm.svelte`, through the `./entity-form` entry (`forms/entity-form.ts`), which is not re-exported from `forms/index.ts` or the root barrel. The form library is an optional peer, so importing it anywhere else would make every consumer install it. `EntityForm` imports only `createForm` and types, never `effect` itself (a peer of the form library, not of this package); everything it renders is this package's own field primitives. `fallow-rules.json` enforces both, and the Effect lint rules whose fixes would import `effect` are off for this one file (root `vite.config.ts`).
- **Nothing heavy on the always-loaded path.** The root barrel (`src/lib/index.ts`) is imported by every consumer on every page. A dependency it pulls in eagerly needs a better reason than convenience; a component that needs a specific third-party dependency belongs in its own package (AGENTS.md § Conventions, `packages/mapbox` is the example).
- **The public surface is `exports`.** The root barrel `src/lib/index.ts` re-exports the core families; the other public entries are `src/lib/<family>/index.ts` (`citations`, `canvas`, `charts`, `tips`, `seo`, and `hotkeys`, which the barrel also re-exports so it can be imported lazily), `forms/entity-form.ts` and `theme.css`, each listed in `package.json` `exports`. Anything reachable from an `exports` entry is a semver commitment and needs a changeset to change.

## Invariants

- **Everything under `src/lib/` ships.** Stories (`src/stories/<family>/`) and tests (`tests/<family>/<Component>.test.ts`) live outside it and mirror `src/lib/<family>/`. `tsconfig.json`'s `include` is `["src", "tests", ".storybook"]`, so a broken story or test fails `vp run check` exactly like a broken component does.
- **`theme.css` is reached through a CSS `@import`, never a JS import**, which is why `"sideEffects": false` holds despite a stylesheet being in the package.
- **Refine, don't redesign.** Extend an existing primitive rather than adding a parallel one; a new one-off component is usually a sign the shared primitive needs a prop.

## Design tokens

[`src/lib/theme.css`](src/lib/theme.css) declares the `light` / `dark` daisyUI themes, and both consumers import it — an application through the package's `./theme.css` export, Storybook's `.storybook/preview.css` relatively — so there is exactly one copy of every token. The values are deliberately neutral (achromatic surfaces, one slate brand hue): this library ships a _starting point_, not a brand, and a consumer is expected to redeclare the two themes.

`@plugin "daisyui" { themes: false; }` in `preview.css` is load-bearing: daisyUI's built-in themes are also called `light` and `dark`, and enabling both sets means two definitions of each fighting over the cascade.

## Testing

Vitest **browser mode**, headless Chromium through Playwright — not a DOM shim. This library's contract is focus order, keyboard handling and the accessibility tree, and happy-dom/jsdom model none of those faithfully enough to be evidence. `tests/setup.ts` registers the jest-dom matchers.

- `render` comes from `vitest-browser-svelte` and is **async** — `await render(...)`, or every locator call lands on a `Promise`.
- Assertions go through `expect.element(locator)`, which retries; the matchers are `@testing-library/jest-dom`'s.
- A `.ts` test has no template to declare a snippet in. Use Svelte's `createRawSnippet`, whose fragment must be a **single element** (wrap bare text in a `<span>`).
- Prefer accessible queries — `getByRole`, `getByLabelText`, `getByText` — over test ids. A test that can only find the element by `data-testid` is not testing the thing the component promises.
- **Vitest's Playwright locator mutates the `position` object you pass it.** `locator.click({ position })` (and `dblclick`/`dropTo`) scale `position` into page pixels in place, so a point declared once and reused drifts by the iframe's scale on its second use. `tests/canvas/pointer.ts`'s `copy(at)` exists for this: pass a fresh `{ x, y }` per call.

## Storybook

`vp run --filter ./packages/components storybook` (dev, port 6006) and `storybook:build`. This is the one Storybook for the workspace: its `stories` glob also reaches across into `packages/mapbox/src/stories`, and `.storybook/preview.css` `@source`s that package's `src` so Tailwind emits the classes its components ask for. Both tasks depend on this package's own `build`, because a maps story imports `@thomasfosterau/components/canvas` — this package's `dist/`. Storybook is outside the `check` graph: the stories are type-checked by `check`, but rendering them is a review affordance; CI runs `storybook:build`. The a11y addon is installed — a story with outstanding violations in that panel is not ready for review.

A story must not depend on anything the consumer would not have: no app state, no network, no `localStorage` writes (the next reviewer inherits them).

## Terms

- **`FieldControl`** — the `{ id, describedBy, invalid, required }` object `fields/FormField` (or `fields/Fieldset`) derives from a single `id` and hands its `children` snippet. Every control in `fields/` accepts it by spread — `<TextInput {...control} bind:value />` — so `for`/`id`, `aria-describedby`, `aria-invalid` and `required` cannot drift apart between the label and the control. Declared in `fields/field-types.ts`.

- **`ItemList` feed mode** — `data/ItemList`'s `feed?` prop switches its wrapper from `<ul>`/`<li>` (the default, where the list structure alone is the semantics) to `<div role="feed" aria-label aria-busy>` of `<article aria-posinset aria-setsize tabindex="-1">`. Feed mode is for a stream where only a window is ever in the DOM (infinite scroll, "load more") — `aria-posinset`/`aria-setsize` state each item's position in the whole even though the DOM only holds a slice, and `busy` reflects a fetch in flight for more. Use the default `<ul>` mode for a list that is entirely in the DOM at once.

- **Chart palette rules** (`theme.css`'s "Categorical chart slots" block, `charts/Chart.svelte`) — four validated custom properties, `--color-chart-1…4`, assigned to series by order and never cycled:
  - **Order is the safety mechanism.** The separation gates are measured on adjacent pairs — what a line, bar or stack actually puts side by side. Re-ordering the slots invalidates the measurement: slots 2 and 4 (indigo/blue) are ΔE 2.7 apart in light and 0.4 in dark under simulated dichromacy, i.e. no colour difference at all for that reader if put next to each other.
  - **Four is the cap; three is the cap for a form that compares every pair at once** (a scatter, a choropleth, a pie), where even the best-separated pair (1↔3) falls to ΔE 4.9 under protanopia. A fifth series is a design problem — fold it into "other", or facet — never a generated hue; `Chart` draws a fifth in `--color-neutral` and names it in the legend.
  - **Status colours are not series colours.** Slot 3 is amber-600, not the amber-500 that is `--color-warning` — a series can never impersonate a state.
  - This is why `Chart`'s `sr-only` data table is always in the DOM regardless of `showTable`: colour is the fast path, never the only one. A consumer replacing `theme.css`'s two themes must replace all four chart slots with their own measured set, in the same order.

- **Tip store frequency vs. status** (`tips/tip-store.svelte.ts`) — `shouldDisplay` checks `TipStatus` before it checks `TipFrequency`: a tip in status `dismissed` or `completed` never shows again regardless of `frequency`, even `'immediate'`. `dismiss(id)` and `complete(id)` are both terminal — the distinction is for the app's own read of `getState`, not for `shouldDisplay`'s behaviour, which treats them identically. Frequency (`immediate`/`hourly`/`daily`/`weekly`/`once`) only gates re-display for a tip that is still in `pending`/`available`.
