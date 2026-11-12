<!-- @component
A list the reader puts in order: rows move by dragging a handle, by keyboard (pick up, move, drop) or through a Move up / Move down menu, and every step is announced.
-->
<!--
  SortableList — a controlled, keyed list whose order the reader changes.
  The component never moves a DOM node itself: it reorders an array, and
  Svelte's keyed `{#each}` (with `animate:flip`, or an instant jump under
  `prefers-reduced-motion`) moves the rows. `items` is bindable and
  reassigned on every committed move; `onReorder(from, to)` is called with
  the old and new index, and if it returns a promise that rejects, the move
  is undone and the failure announced.

  Hand-rolled on Pointer Events, not on bits-ui or a library: bits-ui 2.x has
  no sortable primitive, and the reordering libraries either drive the DOM
  behind Svelte's back (SortableJS) or are React-only (dnd-kit, React Aria).
  The HTML5 drag-and-drop API is not used either: it has no touch support
  and no keyboard model. The move menu is bits-ui's, through `DropdownMenu`.

  ARIA and keyboard contract (dnd-kit's sortable model):
  - The list is `<ul role="list">` (the explicit role survives `list-none`
    in Safari) of `<li>` rows.
  - Each row's handle is a `<button>` named by `handleLabel` ("Reorder
    Bed 4"), described (`aria-describedby`) by one visually hidden
    instructions string per list, and `aria-pressed="true"` while its item
    is held. Space or Enter picks the item up and drops it again; the arrow
    keys on the list's axis (← / → swapped in a right-to-left direction)
    move it one place, Home / End to either end, and Escape cancels and
    restores the original order. Focus stays on the handle as its row moves
    (moving a focused node blurs it, so the handle is re-focused). Focus
    leaving a held handle cancels the move. Pick-up and drop go through the
    button's `click` with `detail === 0` — what a keypress and a screen
    reader's activation both produce — and a pointer's click is ignored.
  - The move menu (`moveMenu`) needs no mode at all, for switch and voice
    users: a `DropdownMenu` per row, its trigger named by `moveMenuLabel`,
    with Move up / Move down / Move to top / Move to bottom, the ones that
    cannot apply disabled. Focus returns to the moved row's trigger.
  - Every pick-up, move, drop, cancel and failure is announced in one
    `aria-live="polite"` region per list, with position and total; every
    string is a prop with an English default.
  - Pointer: a drag starts only from the handle, after 4 px of travel, and
    is then followed on the window (pointer capture would not survive the
    row being moved in the DOM), and
    the handle alone is `touch-action: none`, so the rest of a row still
    scrolls a touch screen. The scroller nearest the list auto-scrolls near
    its edges, and Escape cancels a drag in progress.
-->
<script lang="ts" generics="T">
  import { EllipsisVertical, GripHorizontal, GripVertical } from '@lucide/svelte';
  import { tick, type Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import type { HTMLAttributes } from 'svelte/elements';
  import { prefersReducedMotion } from 'svelte/motion';
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import {
    defaultSortableAnnouncements,
    edgeScroll,
    move,
    slotAt,
    type SortableAnnouncements,
  } from './sortable.ts';

  type Key = string | number;
  type Orientation = 'vertical' | 'horizontal';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    /** The items, in order. Bindable: reassigned with the new order on every committed move. */
    items: T[];
    /** A stable identity per item, for the keyed `{#each}`. */
    key: (item: T) => Key;
    /** The item's name in announcements and in the default control labels. */
    itemLabel: (item: T) => string;
    /** A row's content (the handle and move menu are drawn around it). */
    row: Snippet<[T, { index: number; dragging: boolean }]>;
    /** Called with the old and new index after a move commits; reject to undo it. */
    onReorder?: ((from: number, to: number) => void | Promise<void>) | undefined;
    /**
     * Accessible name of a row's drag handle.
     * @defaultValue `` (item) => `Reorder ${itemLabel(item)}` ``
     */
    handleLabel?: ((item: T) => string) | undefined;
    /**
     * Accessible name of a row's move-menu trigger, and of the open menu.
     * @defaultValue `` (item) => `Move ${itemLabel(item)}` ``
     */
    moveMenuLabel?: ((item: T) => string) | undefined;
    /**
     * How a handle explains the keyboard model (its accessible description).
     * @defaultValue `'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.'`
     */
    instructionsLabel?: string | undefined;
    /** Live-region messages; any one can be replaced. Defaults are English. */
    announcements?: Partial<SortableAnnouncements> | undefined;
    /**
     * Move-menu item that moves a row one place earlier.
     * @defaultValue `'Move up'`, or `'Move back'` when horizontal
     */
    moveUpLabel?: string | undefined;
    /**
     * Move-menu item that moves a row one place later.
     * @defaultValue `'Move down'`, or `'Move forward'` when horizontal
     */
    moveDownLabel?: string | undefined;
    /**
     * Move-menu item that moves a row to the start.
     * @defaultValue `'Move to top'`, or `'Move to start'` when horizontal
     */
    moveToTopLabel?: string | undefined;
    /**
     * Move-menu item that moves a row to the end.
     * @defaultValue `'Move to bottom'`, or `'Move to end'` when horizontal
     */
    moveToBottomLabel?: string | undefined;
    /**
     * Draw each row's drag handle (pointer and keyboard reordering).
     * @defaultValue `true`
     */
    handle?: boolean | undefined;
    /**
     * Draw each row's Move up / Move down / Move to top / Move to bottom menu.
     * @defaultValue `true`
     */
    moveMenu?: boolean | undefined;
    /**
     * The list's axis; horizontal moves with ← / →, mirrored right-to-left.
     * @defaultValue `'vertical'`
     */
    orientation?: Orientation | undefined;
    /**
     * Shows the controls but disables them.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
  }

  let {
    items = $bindable(),
    key,
    itemLabel,
    row,
    onReorder,
    handleLabel = (item: T) => `Reorder ${itemLabel(item)}`,
    moveMenuLabel = (item: T) => `Move ${itemLabel(item)}`,
    instructionsLabel = 'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.',
    announcements,
    moveUpLabel,
    moveDownLabel,
    moveToTopLabel,
    moveToBottomLabel,
    handle = true,
    moveMenu = true,
    orientation = 'vertical',
    disabled = false,
    id,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const instructionsId = $derived(`${id ?? uid}-instructions`);
  const vertical = $derived(orientation === 'vertical');
  const say = $derived({ ...defaultSortableAnnouncements, ...announcements });
  const labels = $derived({
    up: moveUpLabel ?? (vertical ? 'Move up' : 'Move back'),
    down: moveDownLabel ?? (vertical ? 'Move down' : 'Move forward'),
    top: moveToTopLabel ?? (vertical ? 'Move to top' : 'Move to start'),
    bottom: moveToBottomLabel ?? (vertical ? 'Move to bottom' : 'Move to end'),
  });

  const listClasses: Record<Orientation, string> = {
    vertical: 'flex flex-col gap-2',
    horizontal: 'flex flex-row items-center gap-2',
  };

  /** The order on screen while an item is held; `undefined` when none is. */
  let draft = $state.raw<T[] | undefined>();
  let held = $state.raw<{ key: Key; via: 'keyboard' | 'pointer'; origin: number } | undefined>();
  let message = $state('');
  const view = $derived(draft ?? items);

  let list: HTMLUListElement | undefined = $state();
  const rows = new Map<Key, HTMLElement>();
  const handles = new Map<Key, HTMLElement>();
  const triggers = new Map<Key, HTMLElement>();
  /** Set while a re-render moves a focused row, so its blur is not a cancel. */
  let relocating = false;
  /** Bumped per commit, so a late rejection only undoes the latest move. */
  let commits = 0;

  const register = (map: Map<Key, HTMLElement>, k: Key) => (element: HTMLElement) => {
    map.set(k, element);
    return () => {
      if (map.get(k) === element) map.delete(k);
    };
  };

  const indexIn = (order: readonly T[], k: Key): number => order.findIndex((item) => key(item) === k);
  const nameOf = (k: Key): string => {
    const item = items.find((candidate) => key(candidate) === k);
    return item === undefined ? '' : itemLabel(item);
  };

  const refocus = async (map: Map<Key, HTMLElement>, k: Key): Promise<void> => {
    relocating = true;
    await tick();
    map.get(k)?.focus();
    relocating = false;
  };

  const commit = (from: number, to: number, announce: (position: number) => string): void => {
    const before = items;
    const item = before[from];
    if (item === undefined) return;
    const name = itemLabel(item);
    const token = ++commits;
    items = move(before, from, to);
    message = announce(to + 1);
    const result = onReorder?.(from, to);
    if (result instanceof Promise) {
      void result.catch(() => {
        if (token !== commits) return;
        items = before;
        message = say.failed(name, from + 1);
      });
    }
  };

  const pickUp = (k: Key, via: 'keyboard' | 'pointer'): void => {
    const origin = indexIn(items, k);
    if (origin < 0) return;
    draft = [...items];
    held = { key: k, via, origin };
    message = say.pickedUp(nameOf(k), origin + 1, items.length);
  };

  const shift = (to: number): void => {
    if (held === undefined || draft === undefined) return;
    const from = indexIn(draft, held.key);
    const target = Math.min(Math.max(to, 0), draft.length - 1);
    if (from < 0 || target === from) return;
    draft = move(draft, from, target);
    message = say.moved(nameOf(held.key), target + 1, draft.length);
    if (held.via === 'keyboard') void refocus(handles, held.key);
  };

  const drop = (): void => {
    if (held === undefined || draft === undefined) return;
    const { key: k, origin, via } = held;
    const final = indexIn(draft, k);
    const name = nameOf(k);
    const total = draft.length;
    draft = undefined;
    held = undefined;
    if (final === origin) message = say.dropped(name, final + 1, total);
    else commit(origin, final, (position) => say.dropped(name, position, total));
    if (via === 'keyboard') void refocus(handles, k);
  };

  const cancel = (): void => {
    if (held === undefined) return;
    const { key: k, origin, via } = held;
    draft = undefined;
    held = undefined;
    message = say.cancelled(nameOf(k), origin + 1);
    if (via === 'keyboard') void refocus(handles, k);
  };

  const menuMove = (k: Key, to: number): void => {
    const from = indexIn(items, k);
    const target = Math.min(Math.max(to, 0), items.length - 1);
    if (from < 0 || target === from || held !== undefined) return;
    const name = nameOf(k);
    const total = items.length;
    commit(from, target, (position) => say.moved(name, position, total));
    void refocus(triggers, k);
  };

  const reversed = (): boolean =>
    !vertical && list !== undefined && getComputedStyle(list).direction === 'rtl';

  // ── Keyboard ──────────────────────────────────────────────────────────

  const onHandleClick = (event: MouseEvent, k: Key): void => {
    // A pointer's click (detail ≥ 1) ends a press or a drag, not a pick-up.
    if (disabled || event.detail !== 0) return;
    if (held === undefined) pickUp(k, 'keyboard');
    else if (held.key === k && held.via === 'keyboard') drop();
  };

  const onHandleKeydown = (event: KeyboardEvent, k: Key): void => {
    if (held === undefined || held.key !== k || held.via !== 'keyboard' || draft === undefined) {
      return;
    }
    const at = indexIn(draft, k);
    const back = vertical ? 'ArrowUp' : reversed() ? 'ArrowRight' : 'ArrowLeft';
    const forward = vertical ? 'ArrowDown' : reversed() ? 'ArrowLeft' : 'ArrowRight';
    const targets: Record<string, number> = {
      [back]: at - 1,
      [forward]: at + 1,
      Home: 0,
      End: draft.length - 1,
    };
    const target = targets[event.key];
    if (event.key === 'Escape') cancel();
    else if (target !== undefined) shift(target);
    else return;
    event.preventDefault();
  };

  const onHandleBlur = (k: Key): void => {
    if (!relocating && held?.key === k && held.via === 'keyboard') cancel();
  };

  // ── Pointer ───────────────────────────────────────────────────────────

  /** A press on a handle that has not travelled far enough to be a drag. */
  let press: { key: Key; pointerId: number; x: number; y: number } | undefined;
  let pointer = { x: 0, y: 0 };
  let frame: number | undefined;

  /** Where a row starts along the axis, from the list's border edge, ignoring transforms. */
  const offsetStart = (element: HTMLElement, container: HTMLElement): number => {
    const own = vertical ? element.offsetTop : element.offsetLeft;
    if (element.offsetParent === container) {
      return own + (vertical ? container.clientTop : container.clientLeft);
    }
    return own - (vertical ? container.offsetTop : container.offsetLeft);
  };

  const reposition = (): void => {
    if (held === undefined || draft === undefined || list === undefined) return;
    const container = list;
    const heldKey = held.key;
    const bounds = container.getBoundingClientRect();
    const local = vertical
      ? pointer.y - bounds.top + container.scrollTop
      : pointer.x - bounds.left + container.scrollLeft;
    const centres = draft
      .filter((item) => key(item) !== heldKey)
      .map((item) => rows.get(key(item)))
      .filter((element) => element !== undefined)
      .map(
        (element) =>
          offsetStart(element, container) +
          (vertical ? element.offsetHeight : element.offsetWidth) / 2,
      );
    shift(slotAt(centres, local, reversed()));
  };

  /** The nearest ancestor (or the list) that scrolls along the axis; `undefined` is the page. */
  const scroller = (): HTMLElement | undefined => {
    for (
      let element: HTMLElement | null = list ?? null;
      element !== null;
      element = element.parentElement
    ) {
      const overflow = getComputedStyle(element)[vertical ? 'overflowY' : 'overflowX'];
      const room = vertical
        ? element.scrollHeight > element.clientHeight
        : element.scrollWidth > element.clientWidth;
      if (room && (overflow === 'auto' || overflow === 'scroll')) return element;
    }
    return undefined;
  };

  /** Where `target` (or the viewport) starts and ends along the axis, in client px. */
  const scrollSpan = (target: HTMLElement | undefined): readonly [number, number] => {
    if (target === undefined) return [0, vertical ? innerHeight : innerWidth];
    const bounds = target.getBoundingClientRect();
    return vertical ? [bounds.top, bounds.bottom] : [bounds.left, bounds.right];
  };

  const autoScroll = (): void => {
    if (held?.via !== 'pointer') return;
    const target = scroller();
    const [start, end] = scrollSpan(target);
    const delta = edgeScroll(vertical ? pointer.y : pointer.x, start, end);
    if (delta !== 0) {
      (target ?? window).scrollBy(vertical ? { top: delta } : { left: delta });
      reposition();
    }
    frame = requestAnimationFrame(autoScroll);
  };

  const endPress = (): void => {
    press = undefined;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };

  const onPointerDown = (event: PointerEvent, k: Key): void => {
    if (disabled || event.button !== 0 || held !== undefined) return;
    // The rest of the drag is followed on the window, not by pointer capture:
    // capture is released when the keyed `{#each}` moves the handle's row.
    press = { key: k, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (press === undefined || event.pointerId !== press.pointerId) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (held === undefined) {
      if (Math.hypot(pointer.x - press.x, pointer.y - press.y) < 4) return;
      pickUp(press.key, 'pointer');
      frame = requestAnimationFrame(autoScroll);
    }
    reposition();
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (press === undefined || event.pointerId !== press.pointerId) return;
    endPress();
    if (held?.via === 'pointer') drop();
  };

  const onPointerCancel = (event: PointerEvent): void => {
    if (press === undefined || event.pointerId !== press.pointerId) return;
    endPress();
    if (held?.via === 'pointer') cancel();
  };

  const onWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || held?.via !== 'pointer') return;
    event.preventDefault();
    endPress();
    cancel();
  };

  $effect(() => endPress);
</script>

<svelte:window
  onkeydown={onWindowKeydown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerCancel}
/>

{#snippet grip()}
  {#if vertical}<GripVertical class="size-4" />{:else}<GripHorizontal class="size-4" />{/if}
{/snippet}

{#snippet more()}
  <EllipsisVertical class="size-4" />
{/snippet}

{#snippet handleFor(item: T, k: Key, dragging: boolean)}
  <IconButtonCore
    {@attach register(handles, k)}
    label={handleLabel(item)}
    icon={grip}
    size="sm"
    {disabled}
    aria-describedby={instructionsId}
    aria-pressed={dragging ? 'true' : 'false'}
    class={['touch-none', dragging && held?.via === 'pointer' ? 'cursor-grabbing' : 'cursor-grab']}
    onclick={(event: MouseEvent) => onHandleClick(event, k)}
    onkeydown={(event: KeyboardEvent) => onHandleKeydown(event, k)}
    onblur={() => onHandleBlur(k)}
    onpointerdown={(event: PointerEvent) => onPointerDown(event, k)}
  />
{/snippet}

{#snippet menuFor(item: T, k: Key, index: number)}
  {@const first = index === 0}
  {@const last = index === view.length - 1}
  <DropdownMenu label={moveMenuLabel(item)}>
    {#snippet trigger({ props })}
      <IconButtonCore
        {...props}
        {@attach register(triggers, k)}
        label={moveMenuLabel(item)}
        icon={more}
        size="sm"
        disabled={disabled || held !== undefined}
      />
    {/snippet}
    <MenuItem disabled={first} onSelect={() => menuMove(k, index - 1)}>{labels.up}</MenuItem>
    <MenuItem disabled={last} onSelect={() => menuMove(k, index + 1)}>{labels.down}</MenuItem>
    <MenuItem disabled={first} onSelect={() => menuMove(k, 0)}>{labels.top}</MenuItem>
    <MenuItem disabled={last} onSelect={() => menuMove(k, view.length - 1)}>{labels.bottom}</MenuItem>
  </DropdownMenu>
{/snippet}

<ul
  {...rest}
  id={id ?? uid}
  role="list"
  bind:this={list}
  class={[
    'relative',
    listClasses[orientation],
    held?.via === 'pointer' && 'select-none',
    className,
  ]}
>
  {#each view as item, index (key(item))}
    {@const k = key(item)}
    {@const dragging = held?.key === k}
    <li
      {@attach register(rows, k)}
      animate:flip={{ duration: prefersReducedMotion.current ? 0 : 150 }}
      class={[
        'rounded-box flex items-center gap-1',
        dragging && 'bg-base-100 ring-primary relative z-10 shadow-lg ring-2',
      ]}
    >
      {#if handle}{@render handleFor(item, k, dragging)}{/if}
      <div class="min-w-0 flex-1">{@render row(item, { index, dragging })}</div>
      {#if moveMenu}{@render menuFor(item, k, index)}{/if}
    </li>
  {/each}
</ul>
{#if handle}
  <VisuallyHidden id={instructionsId}>{instructionsLabel}</VisuallyHidden>
{/if}
<div aria-live="polite" aria-atomic="true" class="sr-only">{message}</div>
