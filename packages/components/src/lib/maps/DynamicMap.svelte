<!--
  DynamicMap — the interactive, WebGL half: Mapbox GL, panned and zoomed.

  **Mapbox GL is an optional peer, loaded through a dynamic `import()` inside
  the mount effect.** Three reasons, all of them load-bearing:

  - It is ~800 kB of WebGL. A static import would put a mapping engine in the
    shared chunk of every consumer of this package, whose maps live on two
    routes if they exist at all.
  - Its stylesheet is a side effect, and this package claims `sideEffects:
    false`. A top-level `import 'mapbox-gl/dist/mapbox-gl.css'` would make that
    claim false; importing it here means it arrives only where a map does.
  - An app with no maps should not have to install it. Optional peer, so `pnpm`
    does not.

  The package is not installed in this repository at all — the types come from
  `./mapbox-gl.d.ts` — so the path this component takes here is the SAME path an
  application that never installed the peer takes: the `catch` below, and
  `unavailableLabel`. That is the branch the browser test drives.

  ## ARIA contract

  The live map is `role="application"` named by `label`, because its input
  vocabulary is drag and pinch rather than anything a screen reader can narrate.
  When it cannot load, the region is replaced by a `<p>` carrying
  `unavailableLabel` — a sentence, not an empty rectangle. Both strings are
  props with English defaults; nothing here reads copy from a context.

  Scroll-zoom starts DISABLED, and touch re-enables it only while a finger is
  down. A map that swallows the page scroll is the single most common way a map
  on a phone traps the reader — `panHintLabel` says so, once, and then gets out
  of the way.
-->
<script lang="ts">
  import clsx from 'clsx';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { MapCamera, MapStyle } from './types.ts';

  // `style` is omitted from the spread because this component's `style` prop is
  // the MAP style, not the element's inline CSS.
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
    /** A public-scope Mapbox token — safe in the client by design. */
    accessToken: string;
    style: MapStyle;
    camera: MapCamera;
    /** Rendered height; the width fills the container. */
    height?: number;
    /** Names the map for assistive tech. */
    label?: string;
    /** The one-off hint that two fingers, not one, move the map. */
    panHintLabel?: string;
    /** Shown instead of the map when Mapbox GL or WebGL is unavailable. */
    unavailableLabel?: string;
    class?: string | undefined;
  }

  let {
    accessToken,
    style,
    camera,
    height = 400,
    label = 'Map',
    panHintLabel = 'Use two fingers to move the map',
    unavailableLabel = 'Map unavailable',
    class: className,
    ...rest
  }: Props = $props();

  let container = $state<HTMLDivElement>();
  let showHint = $state(true);
  /** Set when the optional peer is absent, so the reader is told rather than shown a blank box. */
  let failed = $state(false);

  $effect(() => {
    const target = container;
    if (target === undefined) return;

    // The teardown has to survive the await: `$effect`'s returned function runs
    // whether or not the import has resolved, so it closes over a mutable slot
    // rather than the map itself.
    let dispose = (): void => {};
    let cancelled = false;

    void (async () => {
      try {
        // `mapbox-gl/dist/mapbox-gl.css` is imported for its side effect — the
        // controls are unstyled without it, and this is the one place in the
        // package where a side-effecting import is correct.
        await import('mapbox-gl/dist/mapbox-gl.css');
        const mapbox = await import('mapbox-gl');
        if (cancelled) return;

        const map = new mapbox.Map({
          container: target,
          accessToken,
          style: `mapbox://styles/${style.username}/${style.styleId}`,
          center: [camera.centre.longitude, camera.centre.latitude],
          zoom: camera.zoom,
          bearing: camera.bearing ?? 0,
          pitch: camera.pitch ?? 0,
          scrollZoom: false,
        });
        map.addControl(new mapbox.NavigationControl({ showCompass: true, showZoom: true }));

        const hideHint = (): void => {
          showHint = false;
        };
        const onTouchStart = (): void => {
          showHint = false;
          map.scrollZoom.enable();
        };
        // Re-disabled a beat after the finger lifts, not immediately: a pinch
        // ends with a moment of inertia, and disabling mid-gesture jolts.
        let settle: ReturnType<typeof globalThis.setTimeout> | undefined;
        const onTouchEnd = (): void => {
          settle = globalThis.setTimeout(() => map.scrollZoom.disable(), 2000);
        };
        const timeout = globalThis.setTimeout(hideHint, 5000);

        map.on('mouseenter', hideHint);
        map.on('touchstart', onTouchStart);
        map.on('touchend', onTouchEnd);

        dispose = () => {
          globalThis.clearTimeout(timeout);
          if (settle !== undefined) globalThis.clearTimeout(settle);
          map.off('mouseenter', hideHint);
          map.off('touchstart', onTouchStart);
          map.off('touchend', onTouchEnd);
          map.remove();
        };
      } catch {
        // The optional peer is not installed, or WebGL is unavailable. Either
        // way the reader gets a sentence, not an empty rectangle.
        failed = true;
      }
    })();

    return () => {
      cancelled = true;
      dispose();
    };
  });
</script>

{#if failed}
  <p class="text-base-content/70 text-sm">{unavailableLabel}</p>
{:else}
  <div
    {...rest}
    bind:this={container}
    itemscope
    itemtype="https://schema.org/Map"
    role="application"
    aria-label={label}
    class={clsx('relative touch-pan-y', className)}
    style:height="{height}px"
  >
    {#if showHint}
      <div
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300"
      >
        <p class="bg-neutral text-neutral-content rounded-box px-4 py-2 text-sm shadow-lg">
          {panHintLabel}
        </p>
      </div>
    {/if}
  </div>
{/if}
