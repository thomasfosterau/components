<!-- @component
Frames a chosen image: a fixed crop frame over an image the reader pans, zooms, turns and straightens, by pointer or keyboard. Binds the crop rectangle and can export the cropped image.
-->
<!--
  ImageCropper — fixed frame, movable image: easier on touch, and simpler to
  make keyboard-operable than eight resize handles. The frame is a focusable
  group: arrows pan, + and − zoom, Home resets. Zoom and straighten are also
  sliders, so every gesture has a control. The live readout speaks only on
  keyboard changes, never mid-drag. The round mask is visual only: the crop
  is always a rectangle, and avatars are rounded where they are shown.
-->
<script lang="ts">
  import { RotateCw, Undo2 } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from '../ui/Button.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import {
    areaOf,
    clampView,
    cropSize,
    cropTransform,
    cssTransform,
    defaultCropReadout,
    defaultStraightenText,
    initialView,
    panView,
    readoutOf,
    rotateView,
    viewOf,
    zoomView,
    type CropArea,
    type CropFrame,
    type CropPoint,
    type CropReadout,
    type CropView,
  } from './crop.ts';
  import { exportCrop, type CropExportOptions } from './crop-export.ts';
  import Slider from './Slider.svelte';

  /** A handle for exporting the crop. */
  interface CropperApi {
    /** Draw the crop to an image. */
    toBlob(options?: CropExportOptions): Promise<Blob>;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The image: a `File`/`Blob` or a URL. */
    src: Blob | string;
    /**
     * The frame's aspect ratio, width over height.
     * @defaultValue `1`
     */
    aspect?: number | undefined;
    /**
     * Show a circular mask, for avatars. The crop is still a rectangle.
     * @defaultValue `false`
     */
    round?: boolean | undefined;
    /** The crop, in source pixels after `rotation`. Bindable; a value passed in reopens that crop. */
    area?: CropArea | undefined;
    /**
     * Lowest zoom; 1 fits the image.
     * @defaultValue `1`
     */
    minZoom?: number | undefined;
    /**
     * Highest zoom.
     * @defaultValue `4`
     */
    maxZoom?: number | undefined;
    /**
     * Offer a ±45° straighten slider.
     * @defaultValue `false`
     */
    straighten?: boolean | undefined;
    /** Bindable handle with `toBlob({ type, quality, maxSize })`. */
    api?: CropperApi | undefined;
    /**
     * The frame's name.
     * @defaultValue `'Crop area'`
     */
    frameLabel?: string | undefined;
    /**
     * The frame's role description.
     * @defaultValue `'crop area'`
     */
    frameDescription?: string | undefined;
    /**
     * The frame's keyboard instructions.
     * @defaultValue `'Use arrow keys to move the image, plus and minus to zoom, Home to reset.'`
     */
    instructionsLabel?: string | undefined;
    /**
     * Zoom slider's name.
     * @defaultValue `'Zoom'`
     */
    zoomLabel?: string | undefined;
    /**
     * Rotate button's name.
     * @defaultValue `'Rotate 90°'`
     */
    rotateLabel?: string | undefined;
    /**
     * Straighten slider's name.
     * @defaultValue `'Straighten'`
     */
    straightenLabel?: string | undefined;
    /**
     * Reset button's name.
     * @defaultValue `'Reset'`
     */
    resetLabel?: string | undefined;
    /**
     * The live readout after a keyboard change.
     * @defaultValue "Showing 62% of the width, towards the left"
     */
    readout?: ((readout: CropReadout) => string) | undefined;
    /**
     * The straighten slider's value text.
     * @defaultValue "Level", "3 degrees clockwise"
     */
    formatStraighten?: ((degrees: number) => string) | undefined;
  }

  let {
    src,
    aspect = 1,
    round = false,
    area = $bindable(),
    minZoom = 1,
    maxZoom = 4,
    straighten = false,
    api = $bindable(),
    frameLabel = 'Crop area',
    frameDescription = 'crop area',
    instructionsLabel = 'Use arrow keys to move the image, plus and minus to zoom, Home to reset.',
    zoomLabel = 'Zoom',
    rotateLabel = 'Rotate 90°',
    straightenLabel = 'Straighten',
    resetLabel = 'Reset',
    readout = defaultCropReadout,
    formatStraighten = defaultStraightenText,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const instructionsId = `${uid}-instructions`;
  const ZOOM_STEP = 1.1;

  let natural: { width: number; height: number } | undefined = $state();
  let view: CropView | undefined = $state();
  let frameWidth = $state(0);
  let announcement = $state('');

  const frame: CropFrame | undefined = $derived(
    natural ? { source: natural, aspect, minZoom, maxZoom } : undefined,
  );
  const frameHeight = $derived(frameWidth / aspect);

  const url = $derived(typeof src === 'string' ? src : URL.createObjectURL(src));
  $effect(() => {
    const current = url;
    return () => {
      if (typeof src !== 'string') {
        URL.revokeObjectURL(current);
      }
    };
  });

  const onLoad = (event: Event): void => {
    if (!(event.currentTarget instanceof HTMLImageElement)) {
      return;
    }
    natural = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
    const loaded: CropFrame = { source: natural, aspect, minZoom, maxZoom };
    const saved = untrack(() => area);
    view = saved ? viewOf(loaded, saved) : initialView(loaded);
  };

  // A changed aspect or zoom range re-fits the current view.
  $effect(() => {
    if (frame) {
      view = clampView(frame, untrack(() => view) ?? initialView(frame));
    }
  });

  $effect(() => {
    if (frame && view) {
      area = areaOf(frame, view);
    }
  });

  const transform = $derived(
    frame && view && frameWidth > 0
      ? cssTransform(cropTransform(frame, view, { width: frameWidth, height: frameHeight }))
      : undefined,
  );

  /** Rotated-image pixels per screen pixel. */
  const sourcePerPixel = (): number =>
    frame && view && frameWidth > 0 ? cropSize(frame, view).width / frameWidth : 1;

  const update = (change: (frame: CropFrame, view: CropView) => CropView): void => {
    if (frame && view) {
      view = change(frame, view);
    }
  };

  const say = (): void => {
    if (frame && view) {
      announcement = readout(readoutOf(frame, view));
    }
  };

  const zoomTo = (zoom: number, focus: CropPoint = { x: 0, y: 0 }): void =>
    update((f, v) => zoomView(f, v, zoom, focus));

  const reset = (): void => update((f) => initialView(f));

  const ARROWS: Readonly<Record<string, CropPoint>> = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
  };

  /** Zoom keys and their factor; `=` and `_` are + and − without Shift. */
  const ZOOM_KEYS: Readonly<Record<string, number>> = {
    '+': ZOOM_STEP,
    '=': ZOOM_STEP,
    '-': 1 / ZOOM_STEP,
    _: 1 / ZOOM_STEP,
  };

  /** Home: centred and fully zoomed out, keeping the turn. */
  const recentre = (): void =>
    update((f, v) => clampView(f, { ...initialView(f), rotation: v.rotation, straighten: v.straighten }));

  const keyChange = (event: KeyboardEvent): (() => void) | undefined => {
    const arrow = ARROWS[event.key];
    if (arrow) {
      const step = (event.shiftKey ? 50 : 10) * sourcePerPixel();
      return () => update((f, v) => panView(f, v, { x: arrow.x * step, y: arrow.y * step }));
    }
    const factor = ZOOM_KEYS[event.key];
    if (factor !== undefined) {
      return () => zoomTo((view?.zoom ?? 1) * factor);
    }
    return event.key === 'Home' ? recentre : undefined;
  };

  const onKeydown = (event: KeyboardEvent): void => {
    const change = keyChange(event);
    if (!change) {
      return;
    }
    event.preventDefault();
    change();
    say();
  };

  /** Pointers down on the frame, for drag-to-pan and pinch-to-zoom. */
  const pointers = new Map<number, CropPoint>();

  const midpoint = (): { centre: CropPoint; spread: number } => {
    const [a, b] = [...pointers.values()];
    if (!a || !b) {
      return { centre: a ?? { x: 0, y: 0 }, spread: 0 };
    }
    return { centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, spread: Math.hypot(a.x - b.x, a.y - b.y) };
  };

  /** A screen point as a vector from the frame's centre, in rotated-image pixels. */
  const focusOf = (node: HTMLElement, point: CropPoint): CropPoint => {
    const box = node.getBoundingClientRect();
    const scale = sourcePerPixel();
    return { x: (point.x - box.left - box.width / 2) * scale, y: (point.y - box.top - box.height / 2) * scale };
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    if (event.currentTarget instanceof Element) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const onPointerMove = (event: PointerEvent): void => {
    const last = pointers.get(event.pointerId);
    if (!last || !(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    const node = event.currentTarget;
    const before = midpoint();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = midpoint();
    const scale = sourcePerPixel();
    update((f, v) =>
      panView(f, v, { x: (before.centre.x - after.centre.x) * scale, y: (before.centre.y - after.centre.y) * scale }),
    );
    if (before.spread > 0 && after.spread > 0) {
      zoomTo((view?.zoom ?? 1) * (after.spread / before.spread), focusOf(node, after.centre));
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
  };

  /** Wheel zoom about the pointer; attached so it can be non-passive and stop the page scrolling. */
  const wheelZoom: Attachment<HTMLElement> = (node) => {
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      zoomTo((view?.zoom ?? 1) * Math.exp(-event.deltaY * 0.002), focusOf(node, { x: event.clientX, y: event.clientY }));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  };

  const toBlob = async (options: CropExportOptions = {}): Promise<Blob> => {
    if (!frame || !view) {
      throw new Error('The image has not loaded yet.');
    }
    return exportCrop(src, frame, view, options);
  };

  $effect(() => {
    untrack(() => {
      api = { toBlob };
    });
  });

  const zoomPercent = $derived(Math.round((view?.zoom ?? minZoom) * 100));
  const straightenDegrees = $derived(view?.straighten ?? 0);

  const setZoomPercent = (percent: number): void => zoomTo(percent / 100);
  const setStraighten = (degrees: number): void =>
    update((f, v) => clampView(f, { ...v, straighten: degrees }));
</script>

<div {...rest} class={['flex flex-col gap-3', className]}>
  <!-- The frame is a keyboard-operable group (APG has no role for a pan-and-zoom surface), like VectorCanvas. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    role="group"
    tabindex="0"
    aria-label={frameLabel}
    aria-roledescription={frameDescription}
    aria-describedby={instructionsId}
    class="bg-base-300 focus-visible:outline-primary rounded-box cursor-grab overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 active:cursor-grabbing"
    style:position="relative"
    style:overflow="hidden"
    style:width="100%"
    style:aspect-ratio={aspect}
    style:touch-action="none"
    bind:clientWidth={frameWidth}
    onkeydown={onKeydown}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    {@attach wheelZoom}
  >
    <img
      src={url}
      alt=""
      draggable="false"
      onload={onLoad}
      style:position="absolute"
      style:left="0"
      style:top="0"
      style:max-width="none"
      style:transform-origin="0 0"
      style:transform={transform}
      style:visibility={transform ? 'visible' : 'hidden'}
    />
    {#if round}
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-full"
        style:box-shadow="0 0 0 100vmax color-mix(in oklab, var(--color-base-100) 65%, transparent)"
      ></div>
    {/if}
    <VisuallyHidden id={instructionsId}>{instructionsLabel}</VisuallyHidden>
    <VisuallyHidden role="status">{announcement}</VisuallyHidden>
  </div>

  <Slider
    label={zoomLabel}
    min={Math.round(minZoom * 100)}
    max={Math.round(maxZoom * 100)}
    step={1}
    bind:value={() => zoomPercent, setZoomPercent}
    formatValue={(n) => `${n}%`}
    disabled={!view}
  />
  {#if straighten}
    <Slider
      label={straightenLabel}
      min={-45}
      max={45}
      step={1}
      bind:value={() => straightenDegrees, setStraighten}
      formatValue={formatStraighten}
      disabled={!view}
    />
  {/if}
  <div class="flex gap-2">
    <Button size="sm" variant="outline" disabled={!view} onclick={() => update(rotateView)}>
      <RotateCw class="size-4" aria-hidden="true" />{rotateLabel}
    </Button>
    <Button size="sm" variant="ghost" disabled={!view} onclick={reset}>
      <Undo2 class="size-4" aria-hidden="true" />{resetLabel}
    </Button>
  </div>
</div>
