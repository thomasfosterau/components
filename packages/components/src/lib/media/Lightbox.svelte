<!-- @component
A full-screen viewer for one image or a set: zoom (pinch, Ctrl+wheel, double-click, buttons), pan when zoomed, and previous/next by swipe, arrow keys or buttons, with a caption and an "n of m" counter.
-->
<!--
  The modal is bits-ui's `Dialog`: focus trap, Escape, scroll lock and focus
  return to the thumbnail that opened it. Zoom and pan are hand-rolled, since
  no primitive covers them; the maths is `zoom.ts`. Every gesture has a
  button: Previous, Next, Zoom in, Zoom out, Reset zoom and Close.

  Keys: ←/→ move between images (flipped in RTL), Home/End go to the ends,
  +/= and − zoom, 0 resets. While zoomed the arrow keys pan instead, and
  Escape resets the zoom before a second Escape closes.

  The structural layout (the fixed stage, the fitted image, its transform) is
  inline style: the transform is data, and the stage must hold without the
  stylesheet. A polite live region reads "Image 3 of 12: {alt}" on each move.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  /** One image in a `Lightbox`. */
  export interface LightboxImage {
    /** The full-size image. */
    readonly src: string;
    /** Responsive candidates; the viewer asks for the largest that fits the screen. */
    readonly srcset?: string | undefined;
    /** Intrinsic width, for the aspect ratio before it loads. */
    readonly width: number;
    /** Intrinsic height. */
    readonly height: number;
    /** Alternative text. Required: it is also what the live region reads. */
    readonly alt: string;
    /** Shown under the image and read as the dialog's description. */
    readonly caption?: string | Snippet<[]> | undefined;
    /** A smaller image for the thumbnail button. Falls back to `src`. */
    readonly thumbnailSrc?: string | undefined;
  }
</script>

<script lang="ts">
  import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from '@lucide/svelte';
  import { Dialog } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import LightboxThumbnails from './LightboxThumbnails.svelte';
  import {
    clampPan,
    isZoomed,
    panBy,
    pinch,
    pinchGeometry,
    swipeIntent,
    toggleZoom,
    unzoomed,
    zoomAbout,
    type Point,
    type Size,
    type ZoomState,
  } from './zoom.ts';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'dir'> {
    /** The images, in order. */
    images: readonly LightboxImage[];
    /** The open image's position; `undefined` when closed. Bindable: set it to open the viewer. */
    index?: number | undefined;
    /**
     * Render a list of thumbnail buttons that open the viewer.
     * @defaultValue `false`
     */
    thumbnails?: boolean | undefined;
    /**
     * Largest zoom factor.
     * @defaultValue `4`
     */
    maxZoom?: number | undefined;
    /**
     * Wrap from the last image to the first.
     * @defaultValue `false`
     */
    loop?: boolean | undefined;
    /**
     * Reading direction; in `'rtl'` the arrow keys, swipes and Previous/Next swap sides.
     * @defaultValue `'ltr'`
     */
    dir?: 'ltr' | 'rtl' | undefined;
    /**
     * The dialog's accessible name.
     * @defaultValue `'Image viewer'`
     */
    dialogLabel?: string | undefined;
    /**
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * @defaultValue `'Previous image'`
     */
    previousLabel?: string | undefined;
    /**
     * @defaultValue `'Next image'`
     */
    nextLabel?: string | undefined;
    /**
     * @defaultValue `'Zoom in'`
     */
    zoomInLabel?: string | undefined;
    /**
     * @defaultValue `'Zoom out'`
     */
    zoomOutLabel?: string | undefined;
    /**
     * @defaultValue `'Reset zoom'`
     */
    resetZoomLabel?: string | undefined;
    /**
     * The visible and spoken position.
     * @defaultValue `` (n, total) => `Image ${n} of ${total}` ``
     */
    counterLabel?: ((n: number, total: number) => string) | undefined;
    /**
     * Names a thumbnail button.
     * @defaultValue `` (alt) => `View ${alt}` ``
     */
    thumbnailLabel?: ((alt: string) => string) | undefined;
  }

  let {
    images,
    index = $bindable(),
    thumbnails = false,
    maxZoom = 4,
    loop = false,
    dir = 'ltr',
    dialogLabel = 'Image viewer',
    closeLabel = 'Close',
    previousLabel = 'Previous image',
    nextLabel = 'Next image',
    zoomInLabel = 'Zoom in',
    zoomOutLabel = 'Zoom out',
    resetZoomLabel = 'Reset zoom',
    counterLabel = (n: number, total: number) => `Image ${n} of ${total}`,
    thumbnailLabel = (alt: string) => `View ${alt}`,
    class: className,
    ...rest
  }: Props = $props();

  const zoomStep = 0.5;
  /** daisyUI's ghost hover and focus fill is light; on the dark backdrop the icon would vanish into it. */
  const onDark =
    'text-neutral-content hover:bg-neutral-content/20 focus-visible:bg-neutral-content/20 focus-visible:outline-neutral-content';
  const panStep = 40;

  let zoom: ZoomState = $state(unzoomed);
  let stage: HTMLDivElement | undefined = $state();
  let picture: HTMLImageElement | undefined = $state();

  const open = $derived(index !== undefined && images[index] !== undefined);
  const current = $derived(index === undefined ? undefined : images[index]);
  const position = $derived((index ?? 0) + 1);
  const counter = $derived(counterLabel(position, images.length));
  const zoomed = $derived(isZoomed(zoom));
  const atStart = $derived(!loop && (index ?? 0) <= 0);
  const atEnd = $derived(!loop && (index ?? 0) >= images.length - 1);

  function goTo(next: number): void {
    if (images.length === 0) return;
    const wrapped = loop ? (next + images.length) % images.length : Math.min(images.length - 1, Math.max(0, next));
    zoom = unzoomed;
    index = wrapped;
  }

  const previous = (): void => goTo((index ?? 0) - 1);
  const next = (): void => goTo((index ?? 0) + 1);

  function close(): void {
    zoom = unzoomed;
    index = undefined;
  }

  function sizes(): { image: Size; stage: Size } {
    return {
      image: { width: picture?.offsetWidth ?? 0, height: picture?.offsetHeight ?? 0 },
      stage: { width: stage?.clientWidth ?? 0, height: stage?.clientHeight ?? 0 },
    };
  }

  /** A client point relative to the stage's centre. */
  function fromClient(clientX: number, clientY: number): Point {
    const rect = stage?.getBoundingClientRect();
    if (rect === undefined) return { x: 0, y: 0 };
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  }

  function zoomTo(scale: number, focal: Point = { x: 0, y: 0 }): void {
    const { image, stage: stageSize } = sizes();
    zoom = zoomAbout(zoom, scale, focal, maxZoom, image, stageSize);
  }

  function pan(dx: number, dy: number): void {
    const { image, stage: stageSize } = sizes();
    zoom = panBy(zoom, dx, dy, image, stageSize);
  }

  /** Which way "forward" is on screen: right in LTR, left in RTL. */
  const forward = $derived(dir === 'rtl' ? -1 : 1);
  const PreviousIcon = $derived(dir === 'rtl' ? ChevronRight : ChevronLeft);
  const NextIcon = $derived(dir === 'rtl' ? ChevronLeft : ChevronRight);

  function onkeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const handled = zoomed ? zoomedKey(event.key) : fittedKey(event.key);
    if (handled) event.preventDefault();
  }

  function zoomKey(key: string): boolean {
    if (key === '+' || key === '=') zoomTo(zoom.scale + zoomStep);
    else if (key === '-' || key === '_') zoomTo(zoom.scale - zoomStep);
    else if (key === '0') zoom = unzoomed;
    else return false;
    return true;
  }

  function fittedKey(key: string): boolean {
    if (key === 'ArrowRight') goTo((index ?? 0) + forward);
    else if (key === 'ArrowLeft') goTo((index ?? 0) - forward);
    else if (key === 'Home') goTo(0);
    else if (key === 'End') goTo(images.length - 1);
    else return zoomKey(key);
    return true;
  }

  const panKeys: Record<string, readonly [number, number]> = {
    ArrowRight: [-panStep, 0],
    ArrowLeft: [panStep, 0],
    ArrowDown: [0, -panStep],
    ArrowUp: [0, panStep],
  };

  function zoomedKey(key: string): boolean {
    const delta = panKeys[key];
    if (delta === undefined) return zoomKey(key);
    pan(delta[0], delta[1]);
    return true;
  }

  function onEscapeKeydown(event: KeyboardEvent): void {
    if (!zoomed) return;
    event.preventDefault();
    zoom = unzoomed;
  }

  // Pointer gestures: one pointer pans when zoomed or swipes when fitted; two pinch.
  const pointers = new Map<number, Point>();
  type Gesture =
    | { kind: 'pan'; start: ZoomState; origin: Point }
    | { kind: 'swipe'; origin: Point }
    | { kind: 'pinch'; start: ZoomState; from: ReturnType<typeof pinchGeometry> };
  let gesture: Gesture | undefined = $state();

  function twoPointers(): readonly [Point, Point] | undefined {
    const [a, b] = [...pointers.values()];
    return a === undefined || b === undefined ? undefined : [a, b];
  }

  function startGesture(): void {
    const pair = twoPointers();
    if (pair !== undefined) {
      gesture = { kind: 'pinch', start: zoom, from: pinchGeometry(...pair) };
      return;
    }
    const [only] = [...pointers.values()];
    if (only === undefined) gesture = undefined;
    else gesture = zoomed ? { kind: 'pan', start: zoom, origin: only } : { kind: 'swipe', origin: only };
  }

  function onpointerdown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stage?.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, fromClient(event.clientX, event.clientY));
    startGesture();
  }

  function onpointermove(event: PointerEvent): void {
    if (!pointers.has(event.pointerId)) return;
    const point = fromClient(event.clientX, event.clientY);
    pointers.set(event.pointerId, point);
    const { image, stage: stageSize } = sizes();
    if (gesture?.kind === 'pinch') {
      const pair = twoPointers();
      if (pair !== undefined) zoom = pinch(gesture.start, gesture.from, pinchGeometry(...pair), maxZoom, image, stageSize);
    } else if (gesture?.kind === 'pan') {
      const { start, origin } = gesture;
      zoom = clampPan({ scale: start.scale, x: start.x + point.x - origin.x, y: start.y + point.y - origin.y }, image, stageSize);
    }
  }

  function onpointerup(event: PointerEvent): void {
    const point = pointers.get(event.pointerId);
    if (point === undefined) return;
    pointers.delete(event.pointerId);
    if (gesture?.kind === 'swipe' && pointers.size === 0) {
      const intent = swipeIntent(point.x - gesture.origin.x, point.y - gesture.origin.y);
      if (intent === 'close') close();
      else if (intent !== undefined) goTo((index ?? 0) + (intent === 'next' ? forward : -forward));
    }
    startGesture();
  }

  function ondblclick(event: MouseEvent): void {
    const { image, stage: stageSize } = sizes();
    zoom = toggleZoom(zoom, fromClient(event.clientX, event.clientY), maxZoom, image, stageSize);
  }

  /** Ctrl+wheel (and a trackpad pinch, which browsers report as one) zooms about the pointer. */
  function onwheel(event: WheelEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoomTo(zoom.scale * Math.exp(-event.deltaY * 0.01), fromClient(event.clientX, event.clientY));
  }

  /** Svelte's `onwheel` is passive, and this one must cancel the browser's page zoom. */
  function wheelZoom(node: HTMLElement): () => void {
    node.addEventListener('wheel', onwheel, { passive: false });
    return () => node.removeEventListener('wheel', onwheel);
  }
</script>

{#if thumbnails}
  <LightboxThumbnails {...rest} class={className} {images} label={thumbnailLabel} onOpen={goTo} />
{/if}

<Dialog.Root
  open={open}
  onOpenChange={(next: boolean) => {
    if (!next) close();
  }}
>
  <Dialog.Portal>
    <Dialog.Overlay class="bg-neutral/90 fixed inset-0 z-40" />
    <Dialog.Content
      {dir}
      {onkeydown}
      {onEscapeKeydown}
      class="text-neutral-content z-50"
      style="position: fixed; inset: 0; display: flex; flex-direction: column;"
    >
      <Dialog.Title class="sr-only">{dialogLabel}</Dialog.Title>
      <div class="flex items-center gap-1 p-2">
        <IconButtonCore label={zoomOutLabel} size="sm" class={onDark} disabled={!zoomed} onclick={() => zoomTo(zoom.scale - zoomStep)}>
          {#snippet icon()}<ZoomOut class="size-5" />{/snippet}
        </IconButtonCore>
        <IconButtonCore label={zoomInLabel} size="sm" class={onDark} disabled={zoom.scale >= maxZoom} onclick={() => zoomTo(zoom.scale + zoomStep)}>
          {#snippet icon()}<ZoomIn class="size-5" />{/snippet}
        </IconButtonCore>
        <IconButtonCore label={resetZoomLabel} size="sm" class={onDark} disabled={!zoomed} onclick={() => (zoom = unzoomed)}>
          {#snippet icon()}<RotateCcw class="size-5" />{/snippet}
        </IconButtonCore>
        <Dialog.Close>
          {#snippet child({ props })}
            <IconButtonCore {...props} label={closeLabel} size="sm" class={[onDark, 'ms-auto']}>
              {#snippet icon()}<X class="size-5" />{/snippet}
            </IconButtonCore>
          {/snippet}
        </Dialog.Close>
      </div>
      {#if current !== undefined}
        <figure style="position: relative; display: flex; flex: 1 1 0; min-height: 0; flex-direction: column; margin: 0;">
          <!-- Pointer gestures only: every one has a button above or beside the image. -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            bind:this={stage}
            {@attach wheelZoom}
            data-lightbox-stage
            class={zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}
            style="position: relative; display: grid; flex: 1 1 0; min-height: 0; place-items: center; overflow: hidden; touch-action: none;"
            {onpointerdown}
            {onpointermove}
            {onpointerup}
            onpointercancel={onpointerup}
            {ondblclick}
          >
            <img
              bind:this={picture}
              src={current.src}
              srcset={current.srcset}
              sizes={current.srcset === undefined ? undefined : '100vw'}
              alt={current.alt}
              width={current.width}
              height={current.height}
              draggable="false"
              class={['select-none', gesture === undefined && 'motion-safe:transition-transform motion-safe:duration-150']}
              style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; transform: translate({zoom.x}px, {zoom.y}px) scale({zoom.scale});"
            />
          </div>
          <IconButtonCore
            label={previousLabel}
            variant="soft"
            shape="circle"
            class="absolute start-2 top-1/2 -translate-y-1/2"
            disabled={atStart}
            onclick={previous}
          >
            {#snippet icon()}<PreviousIcon class="size-5" />{/snippet}
          </IconButtonCore>
          <IconButtonCore
            label={nextLabel}
            variant="soft"
            shape="circle"
            class="absolute end-2 top-1/2 -translate-y-1/2"
            disabled={atEnd}
            onclick={next}
          >
            {#snippet icon()}<NextIcon class="size-5" />{/snippet}
          </IconButtonCore>
          <Dialog.Description>
            {#snippet child({ props })}
              <figcaption {...props} class="bg-neutral/70 flex gap-3 p-3 text-sm">
                <span class="tabular-nums">{counter}</span>
                {#if typeof current.caption === 'string'}
                  <span>{current.caption}</span>
                {:else if current.caption !== undefined}
                  <span>{@render current.caption()}</span>
                {/if}
              </figcaption>
            {/snippet}
          </Dialog.Description>
        </figure>
        <p class="sr-only" aria-live="polite">{counter}: {current.alt}</p>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
