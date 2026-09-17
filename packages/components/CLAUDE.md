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
