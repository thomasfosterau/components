<!-- @component
A responsive `<img>` from a URL or an uploaded image id, optionally wrapped in `<picture>`. `decoding` defaults to `'async'`.
-->
<!--
  Image — a responsive `<img>`, optionally wrapped in `<picture>`.

  Two ways to get a `srcset`: pass `src` directly for a plain image, or pass
  `id` (+ optionally `base`/`widths`) for a width-bucketed rendition served
  by an image-transform route (`${base}/${id}?w=${w}`). Requesting an arbitrary width
  would defeat that bucketing (every distinct width is a distinct transform
  and a distinct cache entry), so `widths` is a fixed list, not a free number.

  `sources` adds art-direction / format-negotiation `<source>` elements ahead
  of the `<img>` fallback, wrapping everything in `<picture>` — each source's
  own `srcset` is the caller's (e.g. an AVIF/WebP rendition list), unrelated
  to the `id`-bucketing above.

  `width`/`height` reserve the box before the bytes arrive — the single most
  visible layout-shift regression a media-heavy page can ship — so pass them
  whenever they are known.

  Phases: while loading, `placeholder` paints the `<img>`'s background (so it
  shows before scripts run) and, without one, `fade` fades the image in once
  decoded. On error the `fallback` replaces it, keeping the alt text visible.
  The placeholder is CSS, so the `<img>` stays the only accessible element.

  ARIA contract: `alt` is required and not defaulted — a caller with no
  meaningful text must pass `""` (decorative) explicitly, which is a
  different, deliberate claim from having forgotten it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLImgAttributes } from 'svelte/elements';
  import ImageFallback from './ImageFallback.svelte';
  import { placeholderStyle, retryUrl, type ImagePhase, type ImagePlaceholder } from './image-placeholder.ts';

  interface ImageSource {
    srcset: string;
    type?: string | undefined;
    media?: string | undefined;
  }

  const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920] as const;

  interface Props extends Omit<HTMLImgAttributes, 'placeholder'> {
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
    base?: string | undefined;
    /**
     * The width buckets the transform route serves. Must match its own list.
     * @defaultValue `[320, 640, 960, 1280, 1920]`
     */
    widths?: readonly number[] | undefined;
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
    sizes?: string | undefined;
    /**
     * Eager-load this image. Use for the one image above the fold; everything else stays lazy.
     * @defaultValue `false`
     */
    eager?: boolean | undefined;
    /** What shows while the image loads: a tiny preview, a colour or a skeleton. `thumbHashPlaceholder` builds one from a ThumbHash. */
    placeholder?: ImagePlaceholder | undefined;
    /**
     * Fade the image in once it has loaded, when there is no `placeholder`. Never animates under reduced motion.
     * @defaultValue `true`
     */
    fade?: boolean | undefined;
    /** Replaces the image when it fails to load; defaults to a box with the alt text and `errorLabel`. */
    fallback?: Snippet<[{ retry: () => void }]> | undefined;
    /**
     * Offer a Retry button in the default fallback.
     * @defaultValue `false`
     */
    retryable?: boolean | undefined;
    /**
     * The default fallback's message.
     * @defaultValue `'Image could not be loaded'`
     */
    errorLabel?: string | undefined;
    /**
     * The default fallback's Retry button.
     * @defaultValue `'Retry'`
     */
    retryLabel?: string | undefined;
    /** Where the image is: `loading`, `loaded` or `error`. Bindable, for reading. */
    phase?: ImagePhase | undefined;
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
    placeholder,
    fade = true,
    fallback,
    retryable = false,
    errorLabel = 'Image could not be loaded',
    retryLabel = 'Retry',
    phase = $bindable('loading'),
    class: className,
    style,
    onload,
    onerror,
    ...rest
  }: Props = $props();

  let attempt = $state(0);
  // Until scripts run, nothing is hidden: a server-rendered image must paint
  // even if hydration never comes.
  let hydrated = $state(false);

  const bucketedHref = $derived(id === undefined ? undefined : `${base}/${id}`);
  const bucketedSrcset = $derived(
    bucketedHref === undefined
      ? undefined
      : widths.map((w) => `${retryUrl(`${bucketedHref}?w=${w}`, attempt)} ${w}w`).join(', '),
  );
  // The largest bucket as the plain `src`: the fallback a browser without
  // `srcset` support (and every crawler) fetches.
  const fallbackWidth = $derived(widths[widths.length - 1]);
  const plainSrc = $derived(src ?? (bucketedHref === undefined ? undefined : `${bucketedHref}?w=${fallbackWidth}`));
  const resolvedSrc = $derived(plainSrc === undefined ? undefined : retryUrl(plainSrc, attempt));
  const loading = $derived(eager ? 'eager' : 'lazy');
  const fetchpriority = $derived(eager ? 'high' : undefined);

  const pending = $derived(phase === 'loading');
  const imgStyle = $derived(
    [pending ? placeholderStyle(placeholder) : undefined, style].filter((part) => part != null).join('; ') ||
      undefined,
  );
  const fades = $derived(fade && placeholder === undefined && hydrated);
  const imgClass = $derived([
    pending && placeholder === 'skeleton' && 'skeleton',
    fades && 'motion-safe:transition-opacity motion-safe:duration-300',
    fades && pending && 'opacity-0',
    className,
  ]);

  /** Pick up a load or failure that happened before hydration. */
  const track = (img: HTMLImageElement): void => {
    hydrated = true;
    if (!img.complete || resolvedSrc === undefined) {
      phase = 'loading';
      return;
    }
    phase = img.naturalWidth > 0 ? 'loaded' : 'error';
  };

  const handleLoad: HTMLImgAttributes['onload'] = (event) => {
    phase = 'loaded';
    onload?.(event);
  };
  const handleError: HTMLImgAttributes['onerror'] = (event) => {
    phase = 'error';
    onerror?.(event);
  };

  const retry = (): void => {
    attempt += 1;
    phase = 'loading';
  };

</script>

{#snippet image()}
  {#key resolvedSrc}
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
      class={imgClass}
      style={imgStyle}
      onload={handleLoad}
      onerror={handleError}
      {@attach track}
    />
  {/key}
{/snippet}

{#if phase === 'error'}
  {#if fallback}
    {@render fallback({ retry })}
  {:else}
    <ImageFallback
      {alt}
      {errorLabel}
      {retryLabel}
      retry={retryable ? retry : undefined}
      {width}
      {height}
      class={className}
    />
  {/if}
{:else if sources && sources.length > 0}
  <picture>
    {#each sources as source (source.srcset)}
      <source srcset={source.srcset} type={source.type} media={source.media} />
    {/each}
    {@render image()}
  </picture>
{:else}
  {@render image()}
{/if}
