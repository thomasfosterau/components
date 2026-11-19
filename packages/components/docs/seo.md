# SEO: head metadata and JSON-LD

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

`@thomasfosterau/components/seo`. Per-page `<head>` metadata and structured data. Both components render only into `<svelte:head>` — nothing in the body.

`serializeJsonLd(data)` escapes `<`, `>`, `&`, U+2028 and U+2029 so authored text cannot close the script element; the output is still valid JSON. `ogImageUrl(card, { href?, basePath? })` builds the content-addressed share-card URL `<basePath>/<slug>.png?t=…&d=…&v=…`, where the `v` token is the card's `updatedAt` in epoch milliseconds, so a content change always mints a new URL (link-preview scrapers only re-fetch a URL they have not seen). It returns `undefined` for a blank title. The param names (`OG_TITLE_PARAM` = `'t'`, `OG_SUBTITLE_PARAM` = `'d'`, `OG_VERSION_PARAM` = `'v'`), the length caps (`OG_TITLE_MAX_LENGTH` = 120 and `OG_SUBTITLE_MAX_LENGTH` = 200 characters, to which `ogImageUrl` truncates the title and description) and `OG_IMAGE_WIDTH` / `OG_IMAGE_HEIGHT` (1200 × 630) are exported so a card renderer reads back exactly what `Head` wrote, and should re-apply the caps itself. The renderer itself is server code and does not live here.

| Type | What it is |
| --- | --- |
| `OgImageCard` | What a share card is built from: `{ id, title, description?, updatedAt? }`. `id` only builds the readable `<slug>.png` path segment; `updatedAt` (a `Date`, ISO string or epoch number) drives the `v` token, and when absent or unparseable the URL is keyed by title and description alone. `Head`'s `shareCard` prop. |
| `OgImageUrlOptions` | `ogImageUrl`'s second argument: `{ href?, basePath? }`. `href` resolves the card path to the emitted URL (identity by default; `Head` passes its `canonicalHref`), `basePath` is where the renderer is mounted (default `'/og'`). |
| `HeadImage` | A share image: `{ url, alt?, width?, height?, type? }`; `url` must be absolute, `type` is the MIME type. `Head`'s `image` and `defaultImage`. |
| `AlternateLink` | One `<link rel="alternate" hreflang>`: `{ href, lang }`, `lang` a BCP 47 tag or `x-default`. `Head`'s `alternates`. |
| `FeedLink` | `Head`'s `feed`: `{ path, title? = 'Latest changes', type? = 'application/feed+json' }`; `path` is resolved through `canonicalHref` like the canonical URL. |
| `Robots` | `Head`'s `robots`: `{ index?, follow? }`, both defaulting to `true`. The `robots` meta is always emitted. |
| `OpenGraphType` | `'website' \| 'article' \| 'profile'` — `Head`'s `openGraphType`, which wins over the one derived from `type`. |
| `SchemaPageType` | `'WebPage' \| 'WebSite' \| 'CollectionPage' \| 'Article' \| 'BlogPosting' \| 'ProfilePage'` — `Head`'s `type`, used only to derive `og:type`. |
| `TwitterCard` | `'summary' \| 'summary_large_image'` — `Head`'s `twitterCard`. |
| `JsonLdObject` | A JSON-LD node with a top-level `@context` — what `JsonLd`'s `data` and `serializeJsonLd` take. Deliberately loose, so `schema-dts`'s `WithContext<Thing>` is assignable to it without this package depending on a vocabulary. |

**Canonical on the production origin.** `Head` resolves the canonical URL, the feed and the share card through `canonicalHref`, which defaults to the components context's `href`. If your `href` returns relative, locale-prefixed paths, pass an absolute resolver instead:

```svelte
<script lang="ts">
  import { Head, JsonLd } from '@thomasfosterau/components/seo';
  import { page } from '$app/state';
  import { locales } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages';

  const canonicalHref = (path: string) => new URL(path, 'https://example.org').href;
</script>

<Head
  title={post.title}
  siteName={m.site_name()}
  description={post.summary}
  type="BlogPosting"
  pathname={page.url.pathname}
  {canonicalHref}
  {locales}
  shareCard={{ id: post.id, title: post.title, description: post.summary, updatedAt: post.updatedAt }}
  defaultImage={{ url: canonicalHref('/og-default.png'), alt: m.site_name(), width: 1200, height: 630, type: 'image/png' }}
  feed={{ path: '/feed.json', title: m.feed_title() }}
/>
<JsonLd data={buildBlogPostingJsonLd(post)} />
```
