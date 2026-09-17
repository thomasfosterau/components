<!--
  Map — the static raster first, the interactive map once the page has
  hydrated.

  The obvious implementation branches on a framework's `browser` flag and puts
  the static map inside a `<noscript>`, which means: a reader with JavaScript
  sees NOTHING until the WebGL engine has downloaded, parsed and painted, and a
  reader without it gets an image the browser has to re-fetch. Both halves are
  wrong, and the framework import is how a shared component ends up knowing
  which app it is in.

  This renders the static raster on the server and in the first client frame —
  so the map is visible immediately, at the right size, with no layout shift —
  and swaps in `DynamicMap` from an effect, which by definition only runs in a
  browser. No app import, no `<noscript>`, and the slow path is the upgrade
  rather than the whole thing.

  `interactive={false}` pins it to the raster, for a thumbnail or a print view.

  ## ARIA contract

  One name, `alt`, serves both halves: it is the raster's alternative text and,
  once upgraded, the live map's accessible name. A map that renamed itself on
  hydration would be a different thing to a screen reader than to everyone else.
-->
<script lang="ts">
  import DynamicMap from './DynamicMap.svelte';
  import StaticMap from './StaticMap.svelte';
  import type { MapCamera, MapStyle } from './types.ts';

  interface Props {
    /** A public-scope Mapbox token — safe in the client by design. */
    accessToken: string;
    style: MapStyle;
    camera: MapCamera;
    /** Intrinsic size of the raster, and the height the live map takes. */
    width: number;
    height: number;
    /** What this map tells the reader; `''` only where it is decoration. */
    alt: string;
    /** Whether to upgrade to the pannable map at all. */
    interactive?: boolean;
    /** Passed to `DynamicMap`; the one-off two-finger hint. */
    panHintLabel?: string;
    /** Passed to `DynamicMap`; shown when Mapbox GL or WebGL is unavailable. */
    unavailableLabel?: string;
    class?: string | undefined;
  }

  let {
    accessToken,
    style,
    camera,
    width,
    height,
    alt,
    interactive = true,
    panHintLabel,
    unavailableLabel,
    class: className,
  }: Props = $props();

  // Flipped from an effect, which never runs during SSR — so the first painted
  // frame is always the raster, on the server and on the client alike.
  let hydrated = $state(false);
  $effect(() => {
    hydrated = true;
  });
</script>

{#if interactive && hydrated}
  <DynamicMap
    {accessToken}
    {style}
    {camera}
    {height}
    label={alt}
    class={className}
    {...panHintLabel === undefined ? {} : { panHintLabel }}
    {...unavailableLabel === undefined ? {} : { unavailableLabel }}
  />
{:else}
  <StaticMap
    {style}
    view={{ kind: 'camera', camera }}
    {width}
    {height}
    {accessToken}
    {alt}
    class={className}
  />
{/if}
