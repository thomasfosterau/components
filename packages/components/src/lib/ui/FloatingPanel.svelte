<!-- @component
A draggable, resizable, non-modal panel floating over the page or a boundary element: tool palettes, inspectors, legends over a canvas or map.
-->
<!--
  FloatingPanel — hand-rolled because bits-ui has no non-modal window. It is
  a `role="dialog"` without `aria-modal` and without a focus trap, so the page
  behind stays usable. The title bar is the drag handle and also the keyboard
  route to every pointer gesture; the corner grip is pointer-only and hidden.
-->
<script lang="ts">
  import { ChevronUp, Maximize2, Minimize2, Minus, X } from '@lucide/svelte';
  import { tick, untrack, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    clampRect,
    defaultMovedAnnouncement,
    defaultPanelLimits,
    defaultResizedAnnouncement,
    moveRect,
    nextPanelZ,
    panelKeyAction,
    panelRing,
    placeOf,
    rescaleRect,
    resizeRect,
    snapRect,
    type PanelLimits,
    type PanelPlace,
    type PanelRect,
    type PanelSize,
    type PanelStage,
  } from './floating-panel.ts';
  import IconButton from './IconButton.svelte';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
    /** The panel's name, shown in its title bar. */
    title: string;
    /** The panel's content. */
    children: Snippet<[]>;
    /**
     * Whether the panel is shown. Bindable; the close button sets it `false`.
     * @defaultValue `true`
     */
    open?: boolean | undefined;
    /**
     * Position and size in pixels from the boundary's top-left corner. Bindable, so the caller may persist it.
     * @defaultValue `{ x: 16, y: 16, width: 320, height: 240 }`
     */
    rect?: PanelRect | undefined;
    /**
     * As placed, collapsed to its title bar, or filling the boundary. Bindable.
     * @defaultValue `'default'`
     */
    stage?: PanelStage | undefined;
    /**
     * The element to stay inside. Render the panel inside it, and give it a position (`relative`).
     * @defaultValue the viewport
     */
    boundary?: HTMLElement | undefined;
    /**
     * Whether the title bar moves the panel.
     * @defaultValue `true`
     */
    draggable?: boolean | undefined;
    /**
     * Whether the panel can be resized.
     * @defaultValue `true`
     */
    resizable?: boolean | undefined;
    /**
     * Smallest size.
     * @defaultValue `{ width: 160, height: 96 }`
     */
    minSize?: PanelSize | undefined;
    /** Largest size; the boundary is always the limit. */
    maxSize?: PanelSize | undefined;
    /**
     * Pull the panel flush to an edge it is dropped near.
     * @defaultValue `true`
     */
    snap?: boolean | undefined;
    /**
     * Close button's name.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * Minimise button's name.
     * @defaultValue `'Minimise'`
     */
    minimizeLabel?: string | undefined;
    /**
     * Maximise button's name.
     * @defaultValue `'Maximise'`
     */
    maximizeLabel?: string | undefined;
    /**
     * Name of the button that undoes minimise or maximise.
     * @defaultValue `'Restore'`
     */
    restoreLabel?: string | undefined;
    /**
     * The title bar's role description.
     * @defaultValue `'draggable panel'`
     */
    dragHandleDescription?: string | undefined;
    /**
     * The title bar's description: its keyboard controls.
     * @defaultValue `'Use arrow keys to move. Hold Shift to resize. Enter maximises.'`
     */
    moveInstructions?: string | undefined;
    /**
     * Announced after a move.
     * @defaultValue "Moved to top right", "Moved to the centre"…
     */
    movedAnnouncement?: ((place: PanelPlace) => string) | undefined;
    /**
     * Announced after a resize.
     * @defaultValue "Resized to 320 by 240"
     */
    resizedAnnouncement?: ((size: PanelSize) => string) | undefined;
  }

  let {
    title,
    children,
    open = $bindable(true),
    rect = $bindable({ x: 16, y: 16, width: 320, height: 240 }),
    stage = $bindable('default'),
    boundary,
    draggable = true,
    resizable = true,
    minSize,
    maxSize,
    snap = true,
    closeLabel = 'Close',
    minimizeLabel = 'Minimise',
    maximizeLabel = 'Maximise',
    restoreLabel = 'Restore',
    dragHandleDescription = 'draggable panel',
    moveInstructions = 'Use arrow keys to move. Hold Shift to resize. Enter maximises.',
    movedAnnouncement = defaultMovedAnnouncement,
    resizedAnnouncement = defaultResizedAnnouncement,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const instructionsId = `${uid}-instructions`;
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const limits: PanelLimits = $derived({
    min: minSize ?? defaultPanelLimits.min,
    max: maxSize ?? defaultPanelLimits.max,
  });

  let bounds: PanelSize = $state({ width: 0, height: 0 });
  let z = $state(nextPanelZ());
  let announcement = $state('');
  let panel: HTMLDivElement | undefined = $state();
  let handle: HTMLElement | undefined = $state();
  let content: HTMLDivElement | undefined = $state();

  const minimized = $derived(stage === 'minimized');
  const maximized = $derived(stage === 'maximized');
  const shown: PanelRect = $derived(
    maximized ? { x: 0, y: 0, width: bounds.width, height: bounds.height } : rect,
  );

  const measure = (): PanelSize =>
    boundary
      ? { width: boundary.clientWidth, height: boundary.clientHeight }
      : { width: window.innerWidth, height: window.innerHeight };

  /** Re-measure the boundary, carrying the rect across the change. */
  const update = (): void => {
    const next = measure();
    untrack(() => {
      rect = rescaleRect(rect, bounds, next, limits);
      bounds = next;
    });
  };

  $effect(() => {
    const target = boundary;
    update();
    if (target) {
      const observer = new ResizeObserver(update);
      observer.observe(target);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  });

  const bringToFront = (): void => {
    z = nextPanelZ();
  };

  const focusInside = (): void => {
    const first = minimized ? undefined : content?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? handle ?? panel)?.focus();
  };

  $effect(() => {
    if (!panel) {
      return;
    }
    return panelRing.add({ element: panel, focus: focusInside });
  });

  let wasOpen = untrack(() => open);
  $effect(() => {
    const now = open;
    if (now && !wasOpen) {
      void tick().then(focusInside);
    }
    wasOpen = now;
  });

  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  const announce = (text: string): void => {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announcement = text;
    }, 300);
  };
  $effect(() => () => clearTimeout(announceTimer));

  const announceMove = (): void => announce(movedAnnouncement(placeOf(rect, bounds)));
  const announceResize = (): void => announce(resizedAnnouncement(rect));

  const toggleStage = (target: 'minimized' | 'maximized'): void => {
    stage = stage === target ? 'default' : target;
  };

  const close = (): void => {
    panelRing.returnToPage();
    open = false;
  };

  const onHandleKeydown = (event: KeyboardEvent): void => {
    const action = panelKeyAction(event, rect, bounds, limits);
    if (!action) {
      return;
    }
    event.preventDefault();
    if (action.kind === 'toggle-maximize') {
      toggleStage('maximized');
      return;
    }
    if (maximized) {
      return;
    }
    rect = action.rect;
    if (action.kind === 'move') {
      announceMove();
    } else {
      announceResize();
    }
  };

  interface Gesture {
    readonly mode: 'move' | 'resize';
    readonly x: number;
    readonly y: number;
    readonly start: PanelRect;
    readonly rtl: boolean;
  }
  let gesture: Gesture | undefined;

  const begin = (mode: Gesture['mode'], event: PointerEvent): void => {
    if (event.button !== 0 || maximized || !panel) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('button') && mode === 'move') {
      return;
    }
    event.preventDefault();
    if (event.currentTarget instanceof Element) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    gesture = {
      mode,
      x: event.clientX,
      y: event.clientY,
      start: rect,
      rtl: getComputedStyle(panel).direction === 'rtl',
    };
  };

  const resizeFrom = (current: Gesture, dx: number, dy: number): PanelRect => {
    if (!current.rtl) {
      return resizeRect(current.start, dx, dy, bounds, limits);
    }
    const right = current.start.x + current.start.width;
    const grown = resizeRect({ ...current.start, x: 0 }, -dx, dy, { ...bounds, width: right }, limits);
    return { ...grown, x: right - grown.width };
  };

  const track = (event: PointerEvent): void => {
    if (!gesture) {
      return;
    }
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    rect =
      gesture.mode === 'move'
        ? moveRect(gesture.start, dx, dy, bounds, limits)
        : resizeFrom(gesture, dx, dy);
  };

  const end = (): void => {
    if (!gesture) {
      return;
    }
    const { mode } = gesture;
    gesture = undefined;
    if (mode === 'resize') {
      announceResize();
      return;
    }
    if (snap) {
      rect = clampRect(snapRect(rect, bounds), bounds, limits);
    }
    announceMove();
  };

  /** Escape leaves the panel open and returns focus to the page. */
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      event.preventDefault();
      panelRing.returnToPage();
    }
  };

  /** Panel-level listeners, attached rather than declared because a dialog is not an interactive role. */
  const panelEvents: Attachment<HTMLElement> = (node) => {
    node.addEventListener('pointerdown', bringToFront, true);
    node.addEventListener('focusin', bringToFront);
    node.addEventListener('keydown', onKeydown);
    return () => {
      node.removeEventListener('pointerdown', bringToFront, true);
      node.removeEventListener('focusin', bringToFront);
      node.removeEventListener('keydown', onKeydown);
    };
  };
</script>

{#snippet minimizeIcon()}
  {#if minimized}<ChevronUp class="size-4" />{:else}<Minus class="size-4" />{/if}
{/snippet}

{#snippet maximizeIcon()}
  {#if maximized}<Minimize2 class="size-4" />{:else}<Maximize2 class="size-4" />{/if}
{/snippet}

{#snippet closeIcon()}<X class="size-4" />{/snippet}

{#snippet titleText()}
  {#if draggable}
    <div
      bind:this={handle}
      id={titleId}
      role="button"
      tabindex="0"
      aria-roledescription={dragHandleDescription}
      aria-describedby={instructionsId}
      class="min-w-0 flex-1 cursor-move truncate"
      style:touch-action="none"
      onkeydown={onHandleKeydown}
      onpointerdown={(event) => begin('move', event)}
      onpointermove={track}
      onpointerup={end}
      onpointercancel={end}
    >
      {title}
    </div>
    <VisuallyHidden id={instructionsId}>{moveInstructions}</VisuallyHidden>
  {:else}
    <span id={titleId} class="min-w-0 flex-1 truncate">{title}</span>
  {/if}
{/snippet}

{#snippet controls()}
  <IconButton
    label={minimized ? restoreLabel : minimizeLabel}
    icon={minimizeIcon}
    size="xs"
    variant="ghost"
    tooltip={false}
    onclick={() => toggleStage('minimized')}
  />
  <IconButton
    label={maximized ? restoreLabel : maximizeLabel}
    icon={maximizeIcon}
    size="xs"
    variant="ghost"
    tooltip={false}
    onclick={() => toggleStage('maximized')}
  />
  <IconButton label={closeLabel} icon={closeIcon} size="xs" variant="ghost" tooltip={false} onclick={close} />
{/snippet}

{#snippet grip()}
  <div
    aria-hidden="true"
    data-resize-handle
    class="border-base-content/30 absolute end-1 bottom-1 size-3 cursor-nwse-resize border-e-2 border-b-2 rtl:cursor-nesw-resize"
    style:touch-action="none"
    onpointerdown={(event) => begin('resize', event)}
    onpointermove={track}
    onpointerup={end}
    onpointercancel={end}
  ></div>
{/snippet}

{#if open}
  <div
    {...rest}
    bind:this={panel}
    {@attach panelEvents}
    role="dialog"
    aria-labelledby={titleId}
    tabindex="-1"
    data-stage={stage}
    class={['bg-base-100 border-base-300 rounded-box overflow-hidden border shadow-xl', className]}
    style:position={boundary ? 'absolute' : 'fixed'}
    style:display="flex"
    style:flex-direction="column"
    style:left="{shown.x}px"
    style:top="{shown.y}px"
    style:width="{shown.width}px"
    style:height={minimized ? undefined : `${shown.height}px`}
    style:z-index={z}
  >
    <div class="bg-base-200 flex items-center gap-2 px-3 py-1.5 text-sm font-medium select-none">
      {@render titleText()}
      {@render controls()}
    </div>
    <div
      bind:this={content}
      inert={minimized}
      class="min-h-0 flex-1 overflow-auto p-3"
      style:display={minimized ? 'none' : undefined}
    >
      {@render children()}
    </div>
    {#if resizable && !minimized && !maximized}
      {@render grip()}
    {/if}
    <VisuallyHidden role="status">{announcement}</VisuallyHidden>
  </div>
{/if}
