<!-- @component
The picture at the top of an `Infobox`, with its caption.
-->
<!--
  InfoboxImage — the picture at the top of an `Infobox`, with its caption.

  `width`/`height` are passed through so the browser can reserve the box
  before the bytes arrive — the difference between a page that settles and
  one that jumps under the reader's eye — but only reserve that space when
  BOTH are present; the caller supplies them together or not at all.

  `eager` (default off: an infobox usually sits beside the prose rather than
  above it, so its picture is rarely the first thing painted) sets
  `loading="eager"` and `fetchpriority="high"` together.
-->
<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';

  interface Props
    extends Omit<HTMLImgAttributes, 'src' | 'alt' | 'width' | 'height' | 'loading' | 'class'> {
    /** Image URL. */
    src: string;
    /** Alternative text; `''` only where the image is decoration. */
    alt: string;
    /** Rendered as the `<figcaption>`. */
    caption?: string | undefined;
    /** Intrinsic width in pixels; reserves the box. */
    width?: number | undefined;
    /** Intrinsic height in pixels; reserves the box. */
    height?: number | undefined;
    /** Eager-loads at high `fetchpriority` — for the page's LCP candidate. */
    eager?: boolean | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let {
    src,
    alt,
    caption,
    width,
    height,
    eager = false,
    class: className,
    ...rest
  }: Props = $props();

  const loading = $derived(eager ? 'eager' : 'lazy');
  const fetchpriority = $derived(eager ? 'high' : undefined);
</script>

<figure class="border-base-300 border-b">
  <img
    {...rest}
    {src}
    {alt}
    {width}
    {height}
    {loading}
    {fetchpriority}
    class={['h-auto w-full', className]}
  />
  {#if caption !== undefined && caption !== ''}
    <figcaption class="text-base-content/60 px-4 py-2 text-center text-xs italic">
      {caption}
    </figcaption>
  {/if}
</figure>
