# @thomasfosterau/components

## 0.1.0

### Minor Changes

- 8129ae0: The generic components that still lived in the apps. Each ships with a story and a browser test.

  - **Added `@thomasfosterau/components/seo`**, a new entry point with:
    - `Head`: title with site-name suffix, canonical on the production origin through `canonicalHref` (defaults to the context `href`), `hreflang` alternates, feed link, Open Graph and Twitter / X tags, share image, `article:*` and `prev` / `next`.
    - `JsonLd`: one XSS-safe JSON-LD block.
    - `serializeJsonLd`
    - `ogImageUrl` and its param-name / length-cap / size constants: the content-addressed share-card URL builder.
  - **Added `@thomasfosterau/components/entity-form`**, a new entry point: `EntityForm` renders `@thomasfosterau/effect-forms-svelte` `defineEntityForm` definitions through this library's field primitives. `@thomasfosterau/effect-forms-svelte` is a new **optional** peer, needed only by this entry. The entry is built and tested against `effect@4.0.0-rc.118`, so install `effect >=4.0.0-rc.118` alongside it; nothing else in this package imports Effect.
  - **Added to `/citations`:** `BookCitation`, `ChapterCitation`, `ScholarlyArticleCitation`, `ThesisCitation`, `ReportCitation` and `Publisher`, the CSL-type renderers. They take local record types (`BookRecord`, `ChapterRecord`, `ScholarlyArticleRecord`, `ThesisRecord`, `ReportRecord`, `PublisherRecord`, `CitationDate`) that will align with `@thomasfosterau/biblio` once it is published.
  - **Added** `Year` (formatting), `ContextLinks` (links), `PushToggle` (fields) and `imageDimensions` / `ImageDimensionsUnavailable` (media).
  - **Changed:** `CreditList`'s optional props and `Credit` members now accept an explicit `undefined`, and a trailing role label no longer leaves a space before the caller's punctuation. `ImageInput` now measures through `imageDimensions`; its behaviour is unchanged.

- bd7ecbd: Releases are published through npm Trusted Publishing (OIDC), from a protected `release` environment, instead of a long-lived `NPM_TOKEN`. The published tarballs are packed by pnpm, so `catalog:` and `workspace:*` specifiers resolve to real version ranges exactly as before; no change to either package's API.
- 5fbc916: First full release of the shared component library (the maps components ship as `@thomasfosterau/components-mapbox`), rebuilt on Tailwind CSS 4 + daisyUI 5 + bits-ui 2.

  The package has never been published, so this is the shape the first real release takes rather than a migration. A minor bump because the package is pre-1.0 (`0.1.0` → `0.2.0`).

  - **Removed** the Melt UI seed components (`Button`, `Card*`, `Dialog`, `Select`, `Tooltip`), the `SelectItem` type and the `./styles.css` export from the earlier scaffold. `melt` is no longer a dependency; interaction is bits-ui 2 throughout.
  - **Added** twelve core families, re-exported from the root barrel — `ui`, `layout`, `feedback`, `fields`, `forms`, `data`, `infobox`, `formatting`, `links`, `media`, `hotkeys`, `search` — plus four separate entry points so a consumer that never uses them never loads them: `@thomasfosterau/components/citations`, `/canvas`, `/charts` and `/tips`. The maps family is **not** an entry point of this package: it needs a specific third-party engine (`mapbox-gl`), and a component that needs one lives in its own package adjacent to this one, so this one stays free of it — it ships as `@thomasfosterau/components-mapbox`, where `mapbox-gl` is a required peer.
  - **Added** the `./theme.css` export: two daisyUI themes (`light`/`dark`) on neutral defaults, including four validated `--color-chart-*` categorical slots, that a consumer is expected to redeclare.
  - **Added** the app-integration seam, `setComponentsContext`/`getComponentsContext` (`locale`, `href`, `navigate`, `isCurrent`) — the one injected dependency every component that resolves a link, navigates, or formats a locale-aware value reads from, so the package stays usable outside SvelteKit.
  - **Convention throughout:** every user-facing string is a prop with an English default (no message catalogue — an i18n app passes its own messages at the call site); every component spreads the native attributes of the element it renders and merges the caller's `class` last; no Effect outside the optional `/entity-form` entry.
  - Reviewed in Storybook 10 with the a11y addon, tested in headless Chromium under Vitest browser mode — one story and one browser test per component, asserting accessible name, role and (for interactive components) keyboard path.

  See [`packages/components/README.md`](../packages/components/README.md) for the full component reference and app-integration guide.

- 08e02ed: Both packages declare the `svelte` peer as `^5.40.0` (raised from the unreleased `^5.30.1`). `@thomasfosterau/effect-forms-svelte@0.2.0`, the optional peer behind the `@thomasfosterau/components/entity-form` entry, declares `svelte` `^5.40.0`, so 5.40.0 was already the real floor for any consumer of that entry; both packages now declare it, so they stay on one floor. A consumer on svelte older than 5.40 gets a peer warning (or an install error under `strict-peer-dependencies`) and should upgrade svelte. No API change.

### Patch Changes

- adc2b53: Every component now carries a `<!-- @component -->` summary, so editors show it on hover, and its props carry doc comments, including `@defaultValue` wherever a default is set. Exported helpers and class tables that had no doc comment now have one. No API change.
- 5bdb819: Tested against effect 4.0.0 (the `entity-form` entry's browser suite and story now run on it); peer floor unchanged.
- 4443925: Every optional property of the exported record and option types now accepts an explicit `undefined`, so a caller compiled with `exactOptionalPropertyTypes` can forward its own optional fields (`{ year: reference.year }`) instead of spreading them conditionally: `Citation`, `Footnote`, `TipConfig`, `TipState`, `TipStoreOptions`, `CanvasElement`, `Transform` and `HistoryEntry` in `@thomasfosterau/components`, the members of `setComponentsContext`'s argument, and `MapCamera`, `MapShape` and `StaticMapRequest` in `@thomasfosterau/components-mapbox`. An explicit `undefined` reads as absent, as omitting the field does. No runtime change.
- 2493b82: Every optional prop these packages declare now accepts an explicit `undefined`, so a wrapper compiled with `exactOptionalPropertyTypes` can forward its own optional prop (`<NumberFormat {maximumFractionDigits}>`, `<DynamicMap {label}>`) instead of spreading it conditionally. An explicit `undefined` falls back to the prop's default, as omitting it does. No runtime change.
