---
'@thomasfosterau/components': minor
---

First full release of the shared component library: 107 Svelte 5 components across 17 families, rebuilt on Tailwind CSS 4 + daisyUI 5 + bits-ui 2, consolidated out of the owner's four apps (website, gardeneria, preferenceflow, in-the-dark).

The package has never been published, so this is the shape the first real release takes rather than a migration. A minor bump because the package is pre-1.0 (`0.1.0` → `0.2.0`).

- **Removed** the Melt UI seed components (`Button`, `Card*`, `Dialog`, `Select`, `Tooltip`), the `SelectItem` type and the `./styles.css` export from the earlier scaffold. `melt` is no longer a dependency; interaction is bits-ui 2 throughout.
- **Added** twelve core families, re-exported from the root barrel — `ui`, `layout`, `feedback`, `fields`, `forms`, `data`, `infobox`, `formatting`, `links`, `media`, `hotkeys`, `search` — plus five separate entry points so a consumer that never uses them never loads them: `@thomasfosterau/components/citations`, `/maps` (`mapbox-gl` an optional peer, reached only through a dynamic `import()`), `/canvas`, `/charts` and `/tips`.
- **Added** the `./theme.css` export: two daisyUI themes (`light`/`dark`) on neutral defaults, including four validated `--color-chart-*` categorical slots, that a consumer is expected to redeclare.
- **Added** the app-integration seam, `setComponentsContext`/`getComponentsContext` (`locale`, `href`, `navigate`, `isCurrent`) — the one injected dependency every component that resolves a link, navigates, or formats a locale-aware value reads from, so the package stays usable outside SvelteKit.
- **Convention throughout:** every user-facing string is a prop with an English default (no message catalogue — an i18n app passes its own messages at the call site); every component spreads the native attributes of the element it renders and merges the caller's `class` last; no Effect anywhere in the package.
- Reviewed in Storybook 10 with the a11y addon, tested in headless Chromium under Vitest browser mode — one story and one browser test per component, asserting accessible name, role and (for interactive components) keyboard path.

See [`packages/components/README.md`](../packages/components/README.md) for the full component reference and app-integration guide.
