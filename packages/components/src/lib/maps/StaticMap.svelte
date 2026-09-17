<!--
  StaticMap — a map as one raster from the Mapbox Static Images API.

  The cheap half of the pair: an `<img>`, no JavaScript, no WebGL, renders on
  the server and in a `<noscript>`. A map surface starts here and upgrades to
  `DynamicMap` only where panning is the point.

  ## ARIA contract

  `alt` is REQUIRED rather than defaulted to `""`. A map is content — it says
  where something is — and a decorative empty alt on it silently withholds that
  from a reader who cannot see it. Where the map really is decoration beside a
  written address, the caller passes `""` deliberately, and the `<img>` drops
  out of the accessibility tree as it should.
-->
<script lang="ts">
  import clsx from 'clsx';
  import type { HTMLImgAttributes } from 'svelte/elements';
  import { staticMapUrl, type StaticView } from './static-url.ts';
  import type { MapStyle } from './types.ts';

  // `style` is omitted from the spread because this component's `style` prop is
  // the MAP style, not the element's inline CSS — one of the two has to give,
  // and renaming the map one would diverge from every other component here.
  interface Props
    extends Omit<
      HTMLImgAttributes,
      'src' | 'srcset' | 'alt' | 'width' | 'height' | 'class' | 'style'
    > {
    style: MapStyle;
    view: StaticView;
    /** CSS pixels; also the intrinsic size, so the box is reserved up front. */
    width: number;
    height: number;
    /** A public-scope Mapbox token — safe in a URL by design. */
    accessToken: string;
    /** What this map tells the reader; `''` only where it is decoration. */
    alt: string;
    /** A GeoJSON overlay drawn onto the raster. */
    overlay?: unknown;
    class?: string | undefined;
  }

  let {
    style,
    view,
    width,
    height,
    accessToken,
    alt,
    overlay,
    class: className,
    ...rest
  }: Props = $props();

  const request = $derived({
    style,
    view,
    width,
    height,
    accessToken,
    ...(overlay === undefined ? {} : { overlay }),
  });
  const src = $derived(staticMapUrl(request));
  // The 2× raster costs a second request only on a display that can show it.
  const srcset = $derived(`${src} 1x, ${staticMapUrl({ ...request, retina: true })} 2x`);
</script>

<img
  {...rest}
  {src}
  {srcset}
  {alt}
  {width}
  {height}
  class={clsx('h-auto max-w-full', className)}
  loading="lazy"
  decoding="async"
/>
