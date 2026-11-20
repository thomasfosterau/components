<!-- @component
A board of columns holding cards that move within and between columns by dragging a handle, by keyboard (pick up, move, drop) or through a "Move to" menu, with every step announced.
-->
<!--
  KanbanBoard — `SortableList`'s model in two dimensions. Controlled and
  keyed: it never moves a DOM node, it reassigns the bindable `columns`, and
  `onMove` persists the move or rejects to undo it. Hand-rolled on Pointer
  Events for the reasons `SortableList` gives; the move menu is bits-ui's.

  ARIA and keyboard contract: the board is a named region of columns, each a
  section headed by its title and card count with a list of cards; no grid
  role, so reading order stays simple. A card's handle is a button described
  by the instructions: Space picks up and drops, ↑/↓ move within the column,
  ←/→ to the next column (mirrored right-to-left) at the nearest position,
  Home/End to either end, Escape cancels. The "Move to" menu needs no mode.
  Every step is announced politely.
-->
<script lang="ts" generics="C">
  import { EllipsisVertical, GripVertical } from '@lucide/svelte';
  import { tick, type Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import type { HTMLAttributes } from 'svelte/elements';
  import { prefersReducedMotion } from 'svelte/motion';
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import MenuRadioGroup from '../ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../ui/MenuRadioItem.svelte';
  import MenuSeparator from '../ui/MenuSeparator.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import {
    defaultBoardAnnouncements,
    defaultBoardCount,
    hasRoom,
    isOverLimit,
    locate,
    moveCard,
    type BoardAnnouncements,
    type BoardColumn,
    type BoardPlace,
  } from './board.ts';
  import { edgeScroll, slotAt } from './sortable.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** The columns and their cards. Bindable: reassigned on every committed move. */
    columns: BoardColumn<C>[];
    /** A stable identity per card. */
    key: (card: C) => string;
    /** The card's name in announcements and control labels. */
    cardLabel: (card: C) => string;
    /** A card's content (the handle and move menu are drawn around it). */
    card: Snippet<[C, { columnId: string; index: number; dragging: boolean }]>;
    /** Persist a committed move; reject to undo it. The signal aborts when a later move supersedes it. */
    onMove?:
      | ((cardId: string, toColumn: string, toIndex: number, signal: AbortSignal) => Promise<void>)
      | undefined;
    /**
     * Refuse moves into a column at its `limit`.
     * @defaultValue `false`
     */
    enforceLimits?: boolean | undefined;
    /**
     * The board's accessible name.
     * @defaultValue `'Board'`
     */
    label?: string | undefined;
    /**
     * The visible count beside a column's title.
     * @defaultValue `"4"`, or `"4 of 5"` with a limit
     */
    countLabel?: ((count: number, limit: number | undefined) => string) | undefined;
    /**
     * The spoken count in a column's heading.
     * @defaultValue `"4 cards"`, or `"4 of 5 cards"` with a limit
     */
    cardsLabel?: ((count: number, limit: number | undefined) => string) | undefined;
    /**
     * A card handle's name.
     * @defaultValue `` (card) => `Move ${cardLabel(card)}` ``
     */
    handleLabel?: ((card: C) => string) | undefined;
    /**
     * A card's "Move to" menu trigger and menu name.
     * @defaultValue `` (card) => `Move ${cardLabel(card)} to…` ``
     */
    moveToLabel?: ((card: C) => string) | undefined;
    /**
     * The handles' keyboard instructions.
     * @defaultValue `'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.'`
     */
    instructionsLabel?: string | undefined;
    /**
     * The menu's column group name.
     * @defaultValue `'Column'`
     */
    columnGroupLabel?: string | undefined;
    /**
     * Menu item moving a card to the top of its column.
     * @defaultValue `'Move to top'`
     */
    moveToTopLabel?: string | undefined;
    /**
     * Menu item moving a card to the bottom of its column.
     * @defaultValue `'Move to bottom'`
     */
    moveToBottomLabel?: string | undefined;
    /** Live-region messages; any one can be replaced. */
    announcements?: Partial<BoardAnnouncements> | undefined;
  }

  let {
    columns = $bindable(),
    key,
    cardLabel,
    card,
    onMove,
    enforceLimits = false,
    label = 'Board',
    countLabel = defaultBoardCount,
    cardsLabel = (count: number, limit: number | undefined) =>
      limit === undefined
        ? `${count} ${count === 1 ? 'card' : 'cards'}`
        : `${count} of ${limit} cards`,
    handleLabel = (item: C) => `Move ${cardLabel(item)}`,
    moveToLabel = (item: C) => `Move ${cardLabel(item)} to…`,
    instructionsLabel = 'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.',
    columnGroupLabel = 'Column',
    moveToTopLabel = 'Move to top',
    moveToBottomLabel = 'Move to bottom',
    announcements,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const instructionsId = `${uid}-instructions`;
  const headingId = (index: number): string => `${uid}-column-${index}`;
  const say = $derived({ ...defaultBoardAnnouncements, ...announcements });

  type Via = 'keyboard' | 'pointer';

  /** The board on screen while a card is held. */
  let draft = $state.raw<BoardColumn<C>[] | undefined>();
  let held = $state.raw<{ id: string; via: Via; origin: BoardPlace } | undefined>();
  let message = $state('');
  const view = $derived(draft ?? columns);

  let board: HTMLElement | undefined = $state();
  const lists = new Map<string, HTMLElement>();
  const rows = new Map<string, HTMLElement>();
  const handles = new Map<string, HTMLElement>();
  const triggers = new Map<string, HTMLElement>();
  /** Set while a re-render moves a focused card, so its blur is not a cancel. */
  let relocating = false;
  let pending: AbortController | undefined;
  let commits = 0;

  const register = (map: Map<string, HTMLElement>, id: string) => (element: HTMLElement) => {
    map.set(id, element);
    return () => {
      if (map.get(id) === element) map.delete(id);
    };
  };

  const nameOf = (id: string): string => {
    const place = locate(columns, key, id);
    const item = place ? columns[place.column]?.cards[place.index] : undefined;
    return item === undefined ? '' : cardLabel(item);
  };
  const titleOf = (on: readonly BoardColumn<C>[], column: number): string =>
    on[column]?.title ?? '';
  const lengthOf = (on: readonly BoardColumn<C>[], column: number): number =>
    on[column]?.cards.length ?? 0;

  const refocus = async (map: Map<string, HTMLElement>, id: string): Promise<void> => {
    relocating = true;
    await tick();
    map.get(id)?.focus();
    relocating = false;
  };

  const persist = (id: string, before: BoardColumn<C>[], from: BoardPlace, to: BoardPlace): void => {
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const token = ++commits;
    const result = onMove?.(id, columns[to.column]?.id ?? '', to.index, controller.signal);
    void result?.catch(() => {
      if (token !== commits) return;
      columns = before;
      message = say.failed(nameOf(id), titleOf(before, from.column), from.index + 1);
    });
  };

  const commit = (id: string, from: BoardPlace, to: BoardPlace, announce: () => string): void => {
    const before = columns;
    columns = moveCard(before, from, to);
    message = announce();
    persist(id, before, from, to);
  };

  /** Whether the card may enter `column` of `on` (it is not already there). */
  const mayEnter = (on: readonly BoardColumn<C>[], from: BoardPlace, column: number): boolean => {
    const target = on[column];
    if (!target || column === from.column || !enforceLimits || hasRoom(target)) return true;
    message = say.overLimit(target.title, target.limit ?? 0);
    return false;
  };

  const pickUp = (id: string, via: Via): void => {
    const origin = locate(columns, key, id);
    if (!origin) return;
    draft = columns;
    held = { id, via, origin };
    message = say.pickedUp(
      nameOf(id),
      titleOf(columns, origin.column),
      origin.index + 1,
      lengthOf(columns, origin.column),
    );
  };

  const shiftTo = (to: BoardPlace): void => {
    if (!held || !draft) return;
    const from = locate(draft, key, held.id);
    if (!from || !draft[to.column] || !mayEnter(draft, from, to.column)) return;
    const across = to.column !== from.column;
    const room = lengthOf(draft, to.column) - (across ? 0 : 1);
    const index = Math.min(Math.max(to.index, 0), room);
    if (!across && index === from.index) return;
    draft = moveCard(draft, from, { column: to.column, index });
    const total = lengthOf(draft, to.column);
    message = across
      ? say.movedTo(nameOf(held.id), titleOf(draft, to.column), index + 1, total)
      : say.movedWithin(nameOf(held.id), index + 1, total);
    if (held.via === 'keyboard') void refocus(handles, held.id);
  };

  const release = (): { id: string; via: Via; origin: BoardPlace; final: BoardPlace } | undefined => {
    if (!held || !draft) return undefined;
    const final = locate(draft, key, held.id) ?? held.origin;
    const released = { ...held, final };
    draft = undefined;
    held = undefined;
    return released;
  };

  const drop = (): void => {
    const released = release();
    if (!released) return;
    const { id, via, origin, final } = released;
    const name = nameOf(id);
    const announce = (): string =>
      say.dropped(name, titleOf(columns, final.column), final.index + 1, lengthOf(columns, final.column));
    if (origin.column === final.column && origin.index === final.index) message = announce();
    else commit(id, origin, final, announce);
    if (via === 'keyboard') void refocus(handles, id);
  };

  const cancel = (): void => {
    const released = release();
    if (!released) return;
    const { id, via, origin } = released;
    message = say.cancelled(nameOf(id), titleOf(columns, origin.column), origin.index + 1);
    if (via === 'keyboard') void refocus(handles, id);
  };

  const menuMove = (id: string, to: BoardPlace): void => {
    const from = locate(columns, key, id);
    if (!from || held || !mayEnter(columns, from, to.column)) return;
    const across = to.column !== from.column;
    const index = Math.min(Math.max(to.index, 0), lengthOf(columns, to.column) - (across ? 0 : 1));
    if (!across && index === from.index) return;
    const name = nameOf(id);
    commit(id, from, { column: to.column, index }, () =>
      say.movedTo(name, titleOf(columns, to.column), index + 1, lengthOf(columns, to.column)),
    );
    void refocus(triggers, id);
  };

  const moveToColumn = (id: string, columnId: string): void => {
    const column = columns.findIndex((candidate) => candidate.id === columnId);
    if (column >= 0) menuMove(id, { column, index: lengthOf(columns, column) });
  };

  const rtl = (): boolean => board !== undefined && getComputedStyle(board).direction === 'rtl';

  // ── Keyboard ──────────────────────────────────────────────────────────

  const onHandleClick = (event: MouseEvent, id: string): void => {
    // A pointer's click (detail ≥ 1) ends a press or a drag, not a pick-up.
    if (event.detail !== 0) return;
    if (!held) pickUp(id, 'keyboard');
    else if (held.id === id && held.via === 'keyboard') drop();
  };

  const keyTarget = (keyName: string, at: BoardPlace): BoardPlace | undefined => {
    const step = rtl() ? -1 : 1;
    const targets: Record<string, BoardPlace> = {
      ArrowUp: { column: at.column, index: at.index - 1 },
      ArrowDown: { column: at.column, index: at.index + 1 },
      ArrowLeft: { column: at.column - step, index: at.index },
      ArrowRight: { column: at.column + step, index: at.index },
      Home: { column: at.column, index: 0 },
      End: { column: at.column, index: Number.POSITIVE_INFINITY },
    };
    return targets[keyName];
  };

  /** With limits enforced, a sideways move steps past full columns to the next with room. */
  const pastFull = (on: readonly BoardColumn<C>[], at: BoardPlace, to: BoardPlace): BoardPlace => {
    const step = Math.sign(to.column - at.column);
    if (!enforceLimits || step === 0) return to;
    let column = to.column;
    while (on[column] && !hasRoom(on[column])) column += step;
    return on[column] ? { ...to, column } : to;
  };

  const onHandleKeydown = (event: KeyboardEvent, id: string): void => {
    if (held?.id !== id || held.via !== 'keyboard' || !draft) return;
    const at = locate(draft, key, id);
    const raw = at ? keyTarget(event.key, at) : undefined;
    const target = at && raw ? pastFull(draft, at, raw) : raw;
    if (event.key === 'Escape') cancel();
    else if (target) shiftTo(target);
    else return;
    event.preventDefault();
  };

  const onHandleBlur = (id: string): void => {
    if (!relocating && held?.id === id && held.via === 'keyboard') cancel();
  };

  // ── Pointer ───────────────────────────────────────────────────────────

  let press: { id: string; pointerId: number; x: number; y: number } | undefined;
  let pointer = { x: 0, y: 0 };
  let frame: number | undefined;

  /** The column whose list is nearest the pointer, horizontally. */
  const columnAt = (x: number): number => {
    let best = -1;
    let distance = Number.POSITIVE_INFINITY;
    for (const [index, column] of view.entries()) {
      const bounds = lists.get(column.id)?.getBoundingClientRect();
      const gap = bounds ? Math.max(bounds.left - x, x - bounds.right, 0) : Number.POSITIVE_INFINITY;
      if (gap < distance) {
        best = index;
        distance = gap;
      }
    }
    return best;
  };

  const reposition = (): void => {
    if (!held || !draft) return;
    const column = columnAt(pointer.x);
    const target = draft[column];
    if (!target) return;
    const heldId = held.id;
    const centres = target.cards
      .filter((item) => key(item) !== heldId)
      .map((item) => rows.get(key(item))?.getBoundingClientRect())
      .filter((bounds) => bounds !== undefined)
      .map((bounds) => bounds.top + bounds.height / 2);
    shiftTo({ column, index: slotAt(centres, pointer.y) });
  };

  const scrollNear = (element: HTMLElement | undefined, vertical: boolean): void => {
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const delta = vertical
      ? edgeScroll(pointer.y, bounds.top, bounds.bottom)
      : edgeScroll(pointer.x, bounds.left, bounds.right);
    if (delta !== 0) element.scrollBy(vertical ? { top: delta } : { left: delta });
  };

  const autoScroll = (): void => {
    if (held?.via !== 'pointer') return;
    scrollNear(board, false);
    scrollNear(lists.get(view[columnAt(pointer.x)]?.id ?? ''), true);
    reposition();
    frame = requestAnimationFrame(autoScroll);
  };

  const endPress = (): void => {
    press = undefined;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };

  const onPointerDown = (event: PointerEvent, id: string): void => {
    if (event.button !== 0 || held) return;
    press = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (press?.pointerId !== event.pointerId) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (!held) {
      if (Math.hypot(pointer.x - press.x, pointer.y - press.y) < 4) return;
      pickUp(press.id, 'pointer');
      frame = requestAnimationFrame(autoScroll);
    }
    reposition();
  };

  const onPointerEnd = (event: PointerEvent): void => {
    if (press?.pointerId !== event.pointerId) return;
    endPress();
    if (held?.via !== 'pointer') return;
    if (event.type === 'pointerup') drop();
    else cancel();
  };

  const onWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || held?.via !== 'pointer') return;
    event.preventDefault();
    endPress();
    cancel();
  };

  $effect(() => () => {
    endPress();
    pending?.abort();
  });
</script>

<svelte:window
  onkeydown={onWindowKeydown}
  onpointermove={onPointerMove}
  onpointerup={onPointerEnd}
  onpointercancel={onPointerEnd}
/>

{#snippet grip()}<GripVertical class="size-4" />{/snippet}
{#snippet more()}<EllipsisVertical class="size-4" />{/snippet}

{#snippet handleFor(item: C, id: string, dragging: boolean)}
  <IconButtonCore
    {@attach register(handles, id)}
    label={handleLabel(item)}
    icon={grip}
    size="sm"
    aria-describedby={instructionsId}
    aria-pressed={dragging ? 'true' : 'false'}
    class={['touch-none', dragging && held?.via === 'pointer' ? 'cursor-grabbing' : 'cursor-grab']}
    onclick={(event: MouseEvent) => onHandleClick(event, id)}
    onkeydown={(event: KeyboardEvent) => onHandleKeydown(event, id)}
    onblur={() => onHandleBlur(id)}
    onpointerdown={(event: PointerEvent) => onPointerDown(event, id)}
  />
{/snippet}

{#snippet menuFor(item: C, id: string, column: BoardColumn<C>, columnIndex: number, index: number)}
  <DropdownMenu label={moveToLabel(item)}>
    {#snippet trigger({ props })}
      <IconButtonCore
        {...props}
        {@attach register(triggers, id)}
        label={moveToLabel(item)}
        icon={more}
        size="sm"
        disabled={held !== undefined}
      />
    {/snippet}
    <MenuRadioGroup
      label={columnGroupLabel}
      value={column.id}
      onValueChange={(columnId) => moveToColumn(id, columnId)}
    >
      {#each columns as option (option.id)}
        <MenuRadioItem
          value={option.id}
          disabled={enforceLimits && option.id !== column.id && !hasRoom(option)}
        >
          {option.title}
        </MenuRadioItem>
      {/each}
    </MenuRadioGroup>
    <MenuSeparator />
    <MenuItem disabled={index === 0} onSelect={() => menuMove(id, { column: columnIndex, index: 0 })}>
      {moveToTopLabel}
    </MenuItem>
    <MenuItem
      disabled={index === column.cards.length - 1}
      onSelect={() => menuMove(id, { column: columnIndex, index: column.cards.length - 1 })}
    >
      {moveToBottomLabel}
    </MenuItem>
  </DropdownMenu>
{/snippet}

{#snippet heading(column: BoardColumn<C>, index: number)}
  <h2 id={headingId(index)} class="flex items-center justify-between gap-2 px-3 pt-3 text-sm font-semibold">
    <span>{column.title}<VisuallyHidden>, {cardsLabel(column.cards.length, column.limit)}</VisuallyHidden></span>
    <span
      aria-hidden="true"
      class={['badge badge-sm', isOverLimit(column) ? 'badge-warning' : 'badge-ghost']}
    >
      {countLabel(column.cards.length, column.limit)}
    </span>
  </h2>
{/snippet}

<section
  {...rest}
  bind:this={board}
  aria-label={label}
  class={['flex items-start gap-4 overflow-x-auto pb-2', held?.via === 'pointer' && 'select-none', className]}
  style:display="flex"
  style:overflow-x="auto"
>
  {#each view as column, columnIndex (column.id)}
    <section
      aria-labelledby={headingId(columnIndex)}
      class="bg-base-200 rounded-box flex w-72 shrink-0 flex-col"
      style:flex-shrink="0"
    >
      {@render heading(column, columnIndex)}
      <ul
        {@attach register(lists, column.id)}
        role="list"
        class="flex max-h-[70vh] min-h-16 flex-col gap-2 overflow-y-auto p-2"
      >
        {#each column.cards as item, index (key(item))}
          {@const id = key(item)}
          {@const dragging = held?.id === id}
          <li
            {@attach register(rows, id)}
            animate:flip={{ duration: prefersReducedMotion.current ? 0 : 150 }}
            class={[
              'bg-base-100 rounded-box flex items-start gap-1 p-1 shadow-sm',
              dragging && 'ring-primary relative z-10 shadow-lg ring-2',
            ]}
          >
            {@render handleFor(item, id, dragging)}
            <div class="min-w-0 flex-1 py-1">
              {@render card(item, { columnId: column.id, index, dragging })}
            </div>
            {@render menuFor(item, id, column, columnIndex, index)}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</section>
<VisuallyHidden id={instructionsId}>{instructionsLabel}</VisuallyHidden>
<div aria-live="polite" aria-atomic="true" class="sr-only">{message}</div>
