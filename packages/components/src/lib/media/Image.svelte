<!-- @component
A responsive `<img>` from a URL or an uploaded image id, optionally wrapped in `<picture>`.
-->
<!--
  Image — a responsive `<img>`, optionally wrapped in `<picture>`.

  Two ways to get a `srcset`: pass `src` directly for a plain image, or pass
  `id` (+ optionally `base`/`widths`) for a width-bucketed rendition served
  by an image-transform route (`${base}/${id}?w=${w}`) — the pattern
  gardeneria's `/images/<id>` binding uses. Requesting an arbitrary width
  would defeat that bucketing (every distinct width is a distinct transform
  and a distinct cache entry), so `widths` is a fixed list, not a free number.

  `sources` adds art-direction / format-negotiation `<source>` elements ahead
  of the `<img>` fallback, wrapping everything in `<picture>` — each source's
  own `srcset` is the caller's (e.g. an AVIF/WebP rendition list), unrelated
  to the `id`-bucketing above.

  `width`/`height` reserve the box before the bytes arrive — the single most
  visible layout-shift regression a media-heavy page can ship — so pass them
  whenever they are known.

  ARIA contract: `alt` is required and not defaulted — a caller with no
  meaningful text must pass `""` (decorative) explicitly, which is a
  different, deliberate claim from having forgotten it.
-->
<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';

  interface ImageSource {
    srcset: string;
    type?: string;
    media?: string;
  }

  const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920] as const;

  interface Props extends HTMLImgAttributes {
    /** Alternative text; `''` only where the image is decoration. */
    alt: string;
    /** A plain image URL. Mutually exclusive with `id`; `src` wins if both are given. */
    src?: string | undefined;
    /** An uploaded image's id — combined with `base`/`widths` into a bucketed `srcset`. */
    id?: string | undefined;
    /**
     * Route prefix the bucketed rendition lives under.
     * @defaultValue `'/images'`
     */
    base?: string;
    /**
     * The width buckets the transform route serves. Must match its own list.
     * @defaultValue `[320, 640, 960, 1280, 1920]`
     */
    widths?: readonly number[];
    /** Extra `<source>` elements (art direction / format negotiation) ahead of the `<img>` fallback. Wraps everything in `<picture>`. */
    sources?: readonly ImageSource[] | undefined;
    /** Intrinsic width; reserves the box against layout shift. */
    width?: number | string | undefined;
    /** Intrinsic height; reserves the box against layout shift. */
    height?: number | string | undefined;
    /**
     * The `sizes` hint.
     * @defaultValue `'100vw'`
     */
    sizes?: string;
    /** Eager-load this image. Use for the one image above the fold; everything else stays lazy. */
    eager?: boolean;
  }

  let {
    alt,
    src,
    id,
    base = '/images',
    widths = DEFAULT_WIDTHS,
    sources,
    width,
    height,
    sizes = '100vw',
    eager = false,
    decoding = 'async',
    ...rest
  }: Props = $props();

  const bucketedHref = $derived(id === undefined ? undefined : `${base}/${id}`);
  const bucketedSrcset = $derived(
    bucketedHref === undefined ? undefined : widths.map((w) => `${bucketedHref}?w=${w} ${w}w`).join(', '),
  );
  // The largest bucket as the plain `src`: the fallback a browser without
  // `srcset` support (and every crawler) fetches.
  const fallbackWidth = $derived(widths[widths.length - 1]);
  const resolvedSrc = $derived(
    src ?? (bucketedHref === undefined ? undefined : `${bucketedHref}?w=${fallbackWidth}`),
  );
  const loading = $derived(eager ? 'eager' : 'lazy');
  const fetchpriority = $derived(eager ? 'high' : undefined);
</script>

{#if sources && sources.length > 0}
  <picture>
    {#each sources as source (source.srcset)}
      <source srcset={source.srcset} type={source.type} media={source.media} />
    {/each}
    <img
      {...rest}
      src={resolvedSrc}
      srcset={bucketedSrcset}
      {sizes}
      {alt}
      {width}
      {height}
      {loading}
      {fetchpriority}
      {decoding}
    />
  </picture>
{:else}
  <img
    {...rest}
    src={resolvedSrc}
    srcset={bucketedSrcset}
    {sizes}
    {alt}
    {width}
    {height}
    {loading}
    {fetchpriority}
    {decoding}
  />
{/if}
