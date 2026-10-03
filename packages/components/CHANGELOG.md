# @thomasfosterau/components

## 0.2.0

### Minor Changes

- 8129ae0: The generic components that still lived in the apps (website, gardeneria, preferenceflow). Each ships with a story and a browser test.

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
- 5fbc916: First full release of the shared component library (the maps components ship as `@thomasfosterau/components-maps`), rebuilt on Tailwind CSS 4 + daisyUI 5 + bits-ui 2, consolidated out of the owner's four apps (website, gardeneria, preferenceflow, in-the-dark).

  The package has never been published, so this is the shape the first real release takes rather than a migration. A minor bump because the package is pre-1.0 (`0.1.0` → `0.2.0`).

  - **Removed** the Melt UI seed components (`Button`, `Card*`, `Dialog`, `Select`, `Tooltip`), the `SelectItem` type and the `./styles.css` export from the earlier scaffold. `melt` is no longer a dependency; interaction is bits-ui 2 throughout.
  - **Added** twelve core families, re-exported from the root barrel — `ui`, `layout`, `feedback`, `fields`, `forms`, `data`, `infobox`, `formatting`, `links`, `media`, `hotkeys`, `search` — plus four separate entry points so a consumer that never uses them never loads them: `@thomasfosterau/components/citations`, `/canvas`, `/charts` and `/tips`. The maps family is **not** an entry point of this package: it needs a specific third-party engine (`mapbox-gl`), and a component that needs one lives in its own package adjacent to this one, so this one stays free of it — it ships as `@thomasfosterau/components-maps`, where `mapbox-gl` is a required peer.
  - **Added** the `./theme.css` export: two daisyUI themes (`light`/`dark`) on neutral defaults, including four validated `--color-chart-*` categorical slots, that a consumer is expected to redeclare.
  - **Added** the app-integration seam, `setComponentsContext`/`getComponentsContext` (`locale`, `href`, `navigate`, `isCurrent`) — the one injected dependency every component that resolves a link, navigates, or formats a locale-aware value reads from, so the package stays usable outside SvelteKit.
  - **Convention throughout:** every user-facing string is a prop with an English default (no message catalogue — an i18n app passes its own messages at the call site); every component spreads the native attributes of the element it renders and merges the caller's `class` last; no Effect outside the optional `/entity-form` entry.
  - Reviewed in Storybook 10 with the a11y addon, tested in headless Chromium under Vitest browser mode — one story and one browser test per component, asserting accessible name, role and (for interactive components) keyboard path.

  See [`packages/components/README.md`](../packages/components/README.md) for the full component reference and app-integration guide.

### Patch Changes

- adc2b53: Every component now carries a `<!-- @component -->` summary, so editors show it on hover, and its props carry doc comments, including `@defaultValue` wherever a default is set. Exported helpers and class tables that had no doc comment now have one. No API change.
- 5bdb819: Tested against effect 4.0.0 (the `entity-form` entry's browser suite and story now run on it); peer floor unchanged.
