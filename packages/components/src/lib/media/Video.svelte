<!--
  Video — the player for an HLS-served video (Cloudflare Stream shape:
  manifest URL + poster + an upload lifecycle).

  Deliberately a plain `<video>` with the HLS manifest as its source and the
  generated thumbnail as its poster. That plays natively in Safari and on
  iOS; everywhere else it needs an MSE shim (e.g. hls.js), which is an
  app-side concern and stays out of this package — it is a real dependency
  weight that must never land in the always-loaded closure of a package every
  page imports. A caller that wants universal playback attaches the shim to
  the element handed to `onReady`.

  While the upload is still pending/processing there is no manifest at all,
  so the component renders the poster (or a neutral placeholder) with the
  state spelled out via `statusLabel` rather than an empty player that
  silently fails.

  ARIA contract: `title` is the player's accessible name (`aria-label`); the
  non-playable placeholder's `statusLabel` is a `badge-neutral`, visible text,
  not conveyed through colour alone.
-->
<script lang="ts">
  interface Props {
    /** The HLS manifest URL; absent until the encode finishes. */
    hlsUrl?: string | undefined;
    /** The poster frame. */
    posterUrl?: string | undefined;
    /** Accessible name for the player. */
    title: string;
    /** Intrinsic dimensions, when known — reserves the box against layout shift. */
    width?: number | undefined;
    height?: number | undefined;
    /** Where the upload is in its lifecycle. */
    uploadState?: 'pending' | 'processing' | 'ready' | 'failed';
    /** Copy for the non-playable placeholder state, supplied by the app (this package holds no messages). */
    statusLabel?: string | undefined;
    /** Called with the mounted `<video>` element once it is playable, for a caller attaching an MSE shim. */
    onReady?: ((element: HTMLVideoElement) => void) | undefined;
    /** A captions track URL (WebVTT). When absent, an empty track is still rendered — see below. */
    captionsSrc?: string | undefined;
    class?: string | undefined;
  }

  let {
    hlsUrl,
    posterUrl,
    title,
    width,
    height,
    uploadState = 'ready',
    statusLabel,
    onReady,
    captionsSrc,
    class: className,
  }: Props = $props();

  let element = $state<HTMLVideoElement>();
  const playable = $derived(uploadState === 'ready' && hlsUrl !== undefined);

  $effect(() => {
    if (element && playable) onReady?.(element);
  });
</script>

<div class={['bg-base-200 rounded-box overflow-hidden', className]}>
  {#if playable}
    <video
      bind:this={element}
      controls
      preload="none"
      poster={posterUrl}
      {width}
      {height}
      aria-label={title}
      class="aspect-video h-auto w-full max-w-full"
    >
      <source src={hlsUrl} type="application/x-mpegURL" />
      {#if captionsSrc}
        <track kind="captions" src={captionsSrc} />
      {:else}
        <!-- A `<track>` is required for a caption-less video to be valid; an
             empty default track is the honest statement that none exists yet,
             rather than silently shipping a video with no captions option. -->
        <track kind="captions" />
      {/if}
    </video>
  {:else}
    <div class="aspect-video relative flex w-full items-center justify-center">
      {#if posterUrl}
        <img src={posterUrl} alt="" class="h-full w-full object-cover opacity-60" />
      {/if}
      {#if statusLabel}
        <span class="badge badge-neutral absolute">{statusLabel}</span>
      {/if}
    </div>
  {/if}
</div>
