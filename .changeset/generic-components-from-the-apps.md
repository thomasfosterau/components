---
'@thomasfosterau/components': minor
---

The generic components that still lived in the apps. Each ships with a story and a browser test.

- **Added `@thomasfosterau/components/seo`**, a new entry point with:
  - `Head`: title with site-name suffix, canonical on the production origin through `canonicalHref` (defaults to the context `href`), `hreflang` alternates, feed link, Open Graph and Twitter / X tags, share image, `article:*` and `prev` / `next`.
  - `JsonLd`: one XSS-safe JSON-LD block.
  - `serializeJsonLd`
  - `ogImageUrl` and its param-name / length-cap / size constants: the content-addressed share-card URL builder.
- **Added `@thomasfosterau/components/entity-form`**, a new entry point: `EntityForm` renders `@thomasfosterau/effect-forms-svelte` `defineEntityForm` definitions through this library's field primitives. `@thomasfosterau/effect-forms-svelte` is a new **optional** peer, needed only by this entry. The entry is built and tested against `effect@4.0.0-rc.118`, so install `effect >=4.0.0-rc.118` alongside it; nothing else in this package imports Effect.
- **Added to `/citations`:** `BookCitation`, `ChapterCitation`, `ScholarlyArticleCitation`, `ThesisCitation`, `ReportCitation` and `Publisher`, the CSL-type renderers. They take local record types (`BookRecord`, `ChapterRecord`, `ScholarlyArticleRecord`, `ThesisRecord`, `ReportRecord`, `PublisherRecord`, `CitationDate`) that will align with `@thomasfosterau/biblio` once it is published.
- **Added** `Year` (formatting), `ContextLinks` (links), `PushToggle` (fields) and `imageDimensions` / `ImageDimensionsUnavailable` (media).
- **Changed:** `CreditList`'s optional props and `Credit` members now accept an explicit `undefined`, and a trailing role label no longer leaves a space before the caller's punctuation. `ImageInput` now measures through `imageDimensions`; its behaviour is unchanged.
