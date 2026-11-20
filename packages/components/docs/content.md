# Content: infobox, formatting, links and media

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

## Infobox

One family, two ways to fill it. Composed primitives (`InfoboxHeader`, `InfoboxImage`, `InfoboxSection`, `InfoboxRow`) let a page build bespoke markup; a typed `rows` convenience on `Infobox` itself lets a page instead hand over a `$derived<InfoboxRowSpec[]>` built from sparse entity attributes — both render through the same primitives, so a fix to row layout lands once.

`InfoboxRowSpec` is a discriminated union on `kind`, and each member is exported on its own:

| Type | Shape | Skipped when |
| --- | --- | --- |
| `InfoboxFactRow` | `{ kind: 'fact', label, value: string \| number \| undefined }` — one identifying fact | `value` is `undefined` or `''` |
| `InfoboxLinkRow` | `{ kind: 'link', label, text, href: string \| undefined, external? }` — one named link with its own visible text | `href` is `undefined` or `''` |
| `InfoboxLinksRow` | `{ kind: 'links', label, links: readonly InfoboxLinkEntry[] \| undefined }` — a relationship rendered as several links (`InfoboxLinkEntry` is `{ label, href }`) | `links` is `undefined` or empty |
| `InfoboxImageRow` | `{ kind: 'image', ...InfoboxImageSpec }` — the identifying picture, rendered above the `<dl>` as an `InfoboxImage` | `src` is `''` |
| `InfoboxCustomRow` | `{ kind: 'custom', label, content: Snippet<[]> }` — arbitrary markup as the value | never |

`InfoboxImageSpec` (`{ src, alt, caption?, width?, height?, eager? }`) is also what `Infobox`'s `image` prop takes. `infoboxRowIsPresent(row): boolean` is the "skipped when" column as a function — the one definition of an empty row that `Infobox` filters `rows` with.

```svelte
<script lang="ts">
  import { Infobox, InfoboxSection, InfoboxRow, type InfoboxRowSpec } from '@thomasfosterau/components';
</script>

<!-- Composed. -->
<Infobox title="Solanum lycopersicum" subtitle="Tomato">
  <InfoboxSection title="Classification">
    <InfoboxRow label="Family" value="Solanaceae" />
    <InfoboxRow label="Genus" href="/taxa/solanum" value="Solanum" />
    <!-- Renders nothing at all — the row is simply absent. -->
    <InfoboxRow label="Frost tolerance" />
  </InfoboxSection>
</Infobox>

<!-- Typed rows — same primitives, one array. -->
<script lang="ts">
  const rows: InfoboxRowSpec[] = [
    { kind: 'image', src: taxon.imageUrl, alt: taxon.name, eager: true },
    { kind: 'fact', label: 'Family', value: taxon.family },
    { kind: 'links', label: 'Synonyms', links: taxon.synonyms.map((s) => ({ label: s.name, href: s.href })) },
  ];
</script>
<Infobox title={taxon.name} {rows} />
```

## Formatting

Locale-aware rendering of dates, numbers, lists, relative time and search-result highlighting. Every `Intl` constructor reads `locales`, then falls back to `getComponentsContext().locale()`.

```svelte
<DateTime value={post.publishedAt} dateStyle="long" />
<NumberFormat value={price} style="currency" currency="AUD" />
<p><FormatList items={tags}>{#snippet children(tag)}<Badge>{tag}</Badge>{/snippet}</FormatList></p>
<RelativeTime value={comment.createdAt} />
<Year value={book.yearPublished} itemprop="datePublished" />
<p><Highlight text={result.title} query={searchQuery} /></p>
```

`formatBytes(bytes, options?, locales?)` is the same formatting as a string, for messages such as an upload limit (`FileInput`'s default `tooLargeMessage` uses it); `scaleBytes` returns the chosen unit and amount, and `formatExactBytes` the count written out ("4,200,000 bytes"). A unit is chosen by its unrounded value and promoted when rounding reaches the next one: 999 bytes is "999 bytes", 999,950 is "1 MB", never "1,000 kB".

## Links

## links

```svelte
<EmailLink email="hello@thomasfoster.au" subject="Question about your garden">
  {#snippet children()}Contact us{/snippet}
</EmailLink>
<ContextLinks links={[{ href: `/taxa/${taxon.id}`, label: taxon.name }]} />
```

## Media

```svelte
<Image id={photo.id} alt="Tomato seedlings in early spring" width={1280} height={720} />
<Video hlsUrl={video.hlsUrl} posterUrl={video.posterUrl} title="Spring garden tour" onReady={attachHlsJs} />
<Figure caption="A row of tomato seedlings"><img src={photo.src} alt="Tomato seedlings" /></Figure>
<Carousel items={photos} label="Photos of Bed 4" autoplay={6000}>
  {#snippet slide(photo)}<Image id={photo.id} alt={photo.alt} width={1280} height={720} />{/snippet}
</Carousel>
<ImageCompare aria-label="Bed 4, March and November" beforeLabel="March" afterLabel="November" bind:value>
  {#snippet before()}<Image id={march.id} alt="Bed 4 in March" width={1280} height={720} />{/snippet}
  {#snippet after()}<Image id={november.id} alt="Bed 4 in November" width={1280} height={720} />{/snippet}
</ImageCompare>
```

While it loads, an `Image` can show a `placeholder` painted as the `<img>`'s own background, so it is server-rendered and needs no extra element: `{ kind: 'lqip', src, color? }` (a tiny preview, usually a `data:` URI from your pipeline), `{ kind: 'color', value }`, or `'skeleton'`. `thumbHashPlaceholder(hash)` turns a base64 [ThumbHash](https://evanw.github.io/thumbhash/) into an `lqip` placeholder, on the server or the client; it lives in its own module, so an app that never calls it doesn't ship the decoder. Without a placeholder the image fades in once loaded (`fade`, on by default, never animating under reduced motion). When it fails, the default fallback keeps the alt text visible with `errorLabel` and, with `retryable`, a Retry button that re-requests a same-origin URL with a `retry` query; pass `fallback` (given `{ retry }`) to draw your own. `bind:phase` reads `'loading'`, `'loaded'` or `'error'`.

```svelte
<Image src={photo.url} alt={photo.alt} width={1280} height={720} placeholder={thumbHashPlaceholder(photo.thumbhash)} retryable />
```

`ImageCompare`'s divider is a bits-ui slider (`role="slider"`, named by `sliderLabel`), so it takes the arrow, Page, Home and End keys and announces `valueText(value)`; name the whole comparison with `aria-label`. Both images keep their own `alt`. `dir="rtl"` puts the leading image on the right.

A daisyUI mask on an `Image` needs no prop: pass it as `class`, from the `maskShape` table so Tailwind sees it (`<Image class={maskShape.hexagon} … />`). Never mask a focusable element; the mask clips its focus ring.

`Embed` is a click-to-load facade for a third-party iframe: a poster, one button and a link to the content on the provider's site, with nothing requested from the provider until the button is pressed (preconnect hints go in on hover or focus). Pressing it swaps in the iframe, autoplaying a video, and moves focus into it; `eager` loads it at once without autoplay. `provider` is `youtube` (on `youtube-nocookie.com`), `vimeo` (`dnt=1`), `google-maps` (the map's embed URL as `id`) or `generic` (an `https:` URL whose origin is in `allowedOrigins`); `embedSource(provider, id, options)` is that mapping as data, returning `undefined` for anything the provider doesn't embed. `consent={{ granted, grant }}` gates loading on a consent category your app tracks: until it is granted, the button reads "Allow YouTube content and play" and calls `grant` before loading.

```svelte
<Embed provider="youtube" id="dQw4w9WgXcQ" title="Planting garlic" start={30} />
<Embed provider="google-maps" id={mapEmbedUrl} title="The community garden" aspect={4 / 3} consent={{ granted: consent.has('marketing'), grant: () => consent.grant('marketing') }} />
```

`imageDimensions(file: Blob): Promise<ImageDimensions>` (`ImageDimensions` is `{ width, height }`, in pixels) reads an image file's intrinsic pixel size with `createImageBitmap`, in the browser, so an upload form can submit `width` / `height` with the binary (it is what `ImageInput` measures with). It rejects with `ImageDimensionsUnavailable` where there is no `createImageBitmap` (on a server), and with the browser's own error for a file that does not decode.
