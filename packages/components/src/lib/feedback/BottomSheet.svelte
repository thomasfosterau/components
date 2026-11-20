<!-- @component
A panel that rises from the bottom edge and rests at one of several heights (detents); drag its grabber, or use the arrow keys on it, to move between them. Modal by default; `modal={false}` leaves the page behind it usable.
-->
<!--
  BottomSheet — SwiftUI's `.presentationDetents`, Compose's
  `ModalBottomSheet` / `BottomSheetScaffold`: results peek at the bottom of a
  map, drag up to browse, drag down to get the map back.

  Hand-rolled gesture, deliberately: bits-ui has no sheet, and the existing
  gesture libraries (vaul) are React-first or a dependency. The modal case is
  `Drawer`'s `DialogFrame`, so focus, dismissal and labelling are the same
  implementation as every other dialog here.

  ARIA contract:
  - Modal (`modal`, the default): `DialogFrame`'s — `role="dialog"` with
    `aria-modal`, named by `title`, focus trap and return, Escape and the
    overlay close it, and the close button is always there.
  - Non-modal: a `<section>` named by its title, so a `region` landmark; no
    trap, nothing inert. Escape inside it collapses it to the lowest detent
    rather than closing it. The close button is there while `dismissible`.
  - Modal with `interactiveBelow`: the modal contract at detents above it;
    at it and below, no overlay, no trap and no `aria-modal`, and a click on
    the page doesn't close it. It stays a `role="dialog"`, and Escape still
    closes it.
  - The grabber is a focusable `role="slider"` named by `handleLabel`, with
    `aria-valuenow` (the detent's index), `aria-valuemin` 0, `aria-valuemax`
    the last index and `aria-valuetext` from `detentLabels`. ↑/↓ move one
    detent, Home/End go to the lowest and highest: the keyboard and switch
    equivalent of the drag (WCAG 2.5.7), and no close ever needs a drag.

  The drag: the grabber captures the pointer and the sheet follows it; on
  release it snaps to the nearest detent, or one further in the direction of
  a fast flick. Released below half the lowest detent, or flicked down from
  the lowest, it closes when `dismissible` and snaps back otherwise. Only the
  grabber drags: the body scrolls natively and never drags the sheet.

  The grabber's 44×44 hit area (WCAG 2.5.5) is inline too, so no theme can
  shrink it. The height is an inline style, set from the detent (`50dvh`) or, while
  dragging, the pointer: data, not a design token. It eases between detents,
  and under `prefers-reduced-motion` snaps without easing.
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import DialogFrame from './DialogFrame.svelte';
  import type { SheetDetent } from './sizes.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    /** Whether the sheet is shown. Bindable. */
    open?: boolean | undefined;
    /** Heading — the sheet's accessible name. */
    title: string;
    /** Supporting line under the heading — the accessible description. */
    description?: string | undefined;
    /** Hide the title visually; it stays the accessible name. */
    hideTitle?: boolean | undefined;
    /**
     * The heights the sheet rests at, smallest first: fractions of the
     * viewport height, or `'content'` to fit its content.
     * @defaultValue `[0.5, 0.92]`
     */
    detents?: readonly SheetDetent[] | undefined;
    /**
     * The index of the detent the sheet rests at. Bindable.
     * @defaultValue `0`
     */
    detent?: number | undefined;
    /**
     * Modal: an overlay, a focus trap and an inert page. Non-modal: the page
     * behind stays interactive, as under a map's results sheet.
     * @defaultValue `true`
     */
    modal?: boolean | undefined;
    /**
     * For a modal sheet: the highest detent index at which the page behind
     * stays usable (no overlay, no focus trap, no scroll lock), as under a
     * map's results sheet that turns modal once pulled up. Omit to be modal
     * at every detent.
     */
    interactiveBelow?: number | undefined;
    /**
     * Whether dragging below the lowest detent closes the sheet (and, when
     * non-modal, whether it has a close button).
     * @defaultValue `true`
     */
    dismissible?: boolean | undefined;
    /**
     * Accessible name of the close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * Accessible name of the grabber.
     * @defaultValue `'Resize sheet'`
     */
    handleLabel?: string | undefined;
    /** The grabber's `aria-valuetext` for each detent ("Collapsed", "Half", "Full"). */
    detentLabels?: readonly string[] | undefined;
    /** The opening control — the caller's own element, spreading `props`. Modal only. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    /** A footer row that stays in view; receives `close`. */
    actions?: Snippet<[{ close: () => void }]> | undefined;
    /** The sheet's body; it scrolls when long. */
    children: Snippet<[]>;
  }

  let {
    open = $bindable(false),
    title,
    description,
    hideTitle = false,
    detents = [0.5, 0.92],
    detent = $bindable(0),
    modal = true,
    interactiveBelow,
    dismissible = true,
    closeLabel = 'Close',
    handleLabel = 'Resize sheet',
    detentLabels,
    trigger,
    actions,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const descriptionId = `${uid}-description`;

  /** A downward speed, in px/ms, past which a release counts as a flick. */
  const FLICK = 0.5;

  const last = $derived(Math.max(0, detents.length - 1));
  const index = $derived(Math.min(Math.max(0, Math.round(detent)), last));
  const modalNow = $derived(interactiveBelow === undefined || index > interactiveBelow);
  /** The sheet's height in px while a drag is in progress. */
  let dragHeight = $state<number | undefined>(undefined);

  const restingStyle = (value: SheetDetent | undefined): string =>
    value === undefined || value === 'content' ? 'max-height: 92dvh' : `height: ${value * 100}dvh`;
  const style = $derived(dragHeight === undefined ? restingStyle(detents[index]) : `height: ${dragHeight}px`);

  const panelClass = $derived([
    'bg-base-100 rounded-t-box fixed inset-x-0 bottom-0 z-50 flex flex-col pb-[env(safe-area-inset-bottom)] shadow-2xl outline-none',
    dragHeight === undefined && 'transition-[height] duration-200 motion-reduce:transition-none',
    className,
  ]);

  const close = (): void => {
    open = false;
  };

  const onHandleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowUp') detent = Math.min(index + 1, last);
    else if (event.key === 'ArrowDown') detent = Math.max(index - 1, 0);
    else if (event.key === 'Home') detent = 0;
    else if (event.key === 'End') detent = last;
    else return;
    event.preventDefault();
  };

  interface Drag {
    readonly pointerId: number;
    readonly startY: number;
    readonly startHeight: number;
    /** Each detent's height in px, measured when the drag began. */
    readonly heights: readonly number[];
    /** Recent pointer positions, for the release velocity. */
    samples: { readonly t: number; readonly y: number }[];
  }
  let drag: Drag | undefined;

  /** The height a `'content'` detent stands for: the panel with its body unscrolled. */
  const naturalHeight = (panel: HTMLElement): number => {
    const body = panel.querySelector<HTMLElement>('[data-dialog-body]');
    const overflow = body === null ? 0 : body.scrollHeight - body.clientHeight;
    return Math.min(panel.offsetHeight + overflow, window.innerHeight * 0.92);
  };

  const onHandlePointerdown = (event: PointerEvent): void => {
    if (event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return;
    const panel = event.currentTarget.closest<HTMLElement>('[data-bottom-sheet]');
    if (panel === null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const content = naturalHeight(panel);
    drag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: panel.getBoundingClientRect().height,
      heights: detents.map((value) => (value === 'content' ? content : value * window.innerHeight)),
      samples: [{ t: event.timeStamp, y: event.clientY }],
    };
    event.preventDefault();
  };

  const onHandlePointermove = (event: PointerEvent): void => {
    if (drag?.pointerId !== event.pointerId) return;
    dragHeight = Math.max(0, drag.startHeight + drag.startY - event.clientY);
    drag.samples = [...drag.samples.filter((sample) => event.timeStamp - sample.t < 100), { t: event.timeStamp, y: event.clientY }];
  };

  /** Where a release at `height` with downward speed `velocity` comes to rest; `-1` closes. */
  const restingIndex = (heights: readonly number[], height: number, velocity: number): number => {
    if (velocity > FLICK) {
      const below = heights.findLastIndex((value) => value < height - 1);
      return below === -1 && height <= (heights[0] ?? 0) + 1 ? -1 : below === -1 ? 0 : below;
    }
    if (velocity < -FLICK) {
      const above = heights.findIndex((value) => value > height + 1);
      return above === -1 ? heights.length - 1 : above;
    }
    if (height < (heights[0] ?? 0) / 2) return -1;
    let nearest = 0;
    for (const [i, value] of heights.entries()) {
      if (Math.abs(value - height) < Math.abs((heights[nearest] ?? 0) - height)) nearest = i;
    }
    return nearest;
  };

  const onHandlePointerup = (event: PointerEvent): void => {
    if (drag?.pointerId !== event.pointerId) return;
    const { heights, samples } = drag;
    // From the release point, not the last move: a quick drag can end before
    // any pointermove is dispatched.
    const height = Math.max(0, drag.startHeight + drag.startY - event.clientY);
    const first = samples[0];
    const elapsed = first === undefined ? 0 : event.timeStamp - first.t;
    const velocity = first === undefined || elapsed <= 0 ? 0 : (event.clientY - first.y) / elapsed;
    drag = undefined;
    dragHeight = undefined;
    const next = restingIndex(heights, height, velocity);
    if (next === -1 && dismissible) close();
    else detent = Math.max(0, next);
  };

  const onHandlePointercancel = (event: PointerEvent): void => {
    if (drag?.pointerId !== event.pointerId) return;
    drag = undefined;
    dragHeight = undefined;
  };

  /** Non-modal: Escape inside collapses to the lowest detent. A listener, since a landmark takes no handlers. */
  const collapseOnKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    detent = 0;
    event.stopPropagation();
  };
  const collapseOnEscape: Attachment<HTMLElement> = (node) => {
    node.addEventListener('keydown', collapseOnKeydown);
    return () => node.removeEventListener('keydown', collapseOnKeydown);
  };
</script>

{#snippet grabber()}
  <div class="flex shrink-0 justify-center pt-1">
    <div
      role="slider"
      tabindex="0"
      aria-label={handleLabel}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={index}
      aria-valuetext={detentLabels?.[index]}
      class="focus-visible:outline-primary flex cursor-grab touch-none items-center justify-center rounded-full focus-visible:outline-2 active:cursor-grabbing"
      style:width="2.75rem"
      style:height="2.75rem"
      onkeydown={onHandleKeydown}
      onpointerdown={onHandlePointerdown}
      onpointermove={onHandlePointermove}
      onpointerup={onHandlePointerup}
      onpointercancel={onHandlePointercancel}
    >
      <span class="bg-base-content/30 block h-1.5 w-10 rounded-full"></span>
    </div>
  </div>
{/snippet}

{#if modal}
  <DialogFrame
    bind:open
    {title}
    {description}
    {closeLabel}
    {hideTitle}
    {trigger}
    {actions}
    {children}
    {grabber}
    layout="sheet"
    modal={modalNow}
    modalityChanges={interactiveBelow !== undefined}
    contentClass={panelClass}
    contentProps={{ ...rest, style, 'data-bottom-sheet': '' }}
  />
{:else if open}
  <section
    {...rest}
    aria-labelledby={titleId}
    aria-describedby={description === undefined ? undefined : descriptionId}
    class={panelClass}
    {style}
    data-bottom-sheet
    {@attach collapseOnEscape}
  >
    {@render grabber()}
    <div class="flex items-start justify-between gap-4 px-4">
      <h2 id={titleId} class={hideTitle ? 'sr-only' : 'text-lg font-semibold'}>{title}</h2>
      {#if dismissible}
        <IconButtonCore label={closeLabel} size="sm" class="-mt-1 -mr-1 ms-auto" onclick={close}>
          {#snippet icon()}<X class="size-4" />{/snippet}
        </IconButtonCore>
      {/if}
    </div>
    {#if description !== undefined}
      <p id={descriptionId} class="text-base-content/70 mt-1 px-4 text-sm leading-6">{description}</p>
    {/if}
    <div data-dialog-body class="min-h-0 flex-1 overflow-y-auto p-4">{@render children()}</div>
    {#if actions}
      <div class="border-base-300 flex justify-end gap-2 border-t p-4">{@render actions({ close })}</div>
    {/if}
  </section>
{/if}
