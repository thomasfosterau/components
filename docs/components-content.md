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
```

A daisyUI mask on an `Image` needs no prop: pass it as `class`, from the `maskShape` table so Tailwind sees it (`<Image class={maskShape.hexagon} … />`). Never mask a focusable element; the mask clips its focus ring.

`imageDimensions(file: Blob): Promise<ImageDimensions>` (`ImageDimensions` is `{ width, height }`, in pixels) reads an image file's intrinsic pixel size with `createImageBitmap`, in the browser, so an upload form can submit `width` / `height` with the binary (it is what `ImageInput` measures with). It rejects with `ImageDimensionsUnavailable` where there is no `createImageBitmap` (on a server), and with the browser's own error for a file that does not decode.
