<!-- @component
A grid of tiles the reader can rearrange: in edit mode each tile moves by its handle (drag or keyboard) or its menu, changes size from presets, and can be removed and added back.
-->
<!--
  DashboardGrid — tiles on a column grid, placed by a bindable `layout` the
  caller persists. The layout is stored at the widest column count; a
  narrower grid reflows the tiles in reading order, and there a tile's
  handle and menu reorder rather than move in two dimensions.

  ARIA and keyboard contract:
  - A `region` named by `label`; each tile a `section` named by its heading.
    The DOM order is the reading order (top to bottom, then start to end),
    so Tab order always follows the layout.
  - "Edit dashboard" is a toggle button (`aria-pressed`). Outside edit mode
    tiles carry no controls.
  - In edit mode each tile's "Move {title}" handle picks up on Space or
    Enter, moves one cell with the arrow keys (mirrored right-to-left),
    drops on Space or Enter and cancels on Escape; each step is announced
    in one polite live region. A pointer drags it from the same handle,
    the held tile showing its target cells and pushing others down.
  - The "{title} options" menu sets a size preset, moves the tile in
    reading order, and removes it. "Add widget" lists removed tiles;
    "Reset layout" restores `defaultLayout` after a confirmation.
-->
<script lang="ts">
  import { tick } from 'svelte';
  import { flip } from 'svelte/animate';
  import type { HTMLAttributes } from 'svelte/elements';
  import { prefersReducedMotion } from 'svelte/motion';
  import { edgeScroll } from '../data/sortable.ts';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';
  import DashboardTileHeader from './DashboardTileHeader.svelte';
  import DashboardToolbar from './DashboardToolbar.svelte';
  import {
    columnsAt,
    defaultDashboardAnnouncements,
    hideTile,
    isTileSize,
    moveInOrder,
    normaliseLayout,
    placeTile,
    readingOrder,
    reflow,
    resizeTile,
    sameLayout,
    showTile,
    sizeOf,
    tileSizes,
    widestColumns,
    type DashboardAnnouncements,
    type DashboardColumns,
    type DashboardTile,
    type TileLayout,
    type TileSize,
  } from './dashboard.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    tiles: readonly DashboardTile[];
    /** Where each tile sits. Bindable: reassigned on every change, for the caller to persist. */
    layout: TileLayout[];
    /** Called with the new layout after every change. */
    onLayoutChange?: ((layout: TileLayout[]) => void) | undefined;
    /** "Reset layout" restores this; without it there is no Reset button. */
    defaultLayout?: readonly TileLayout[] | undefined;
    /**
     * Columns by the grid's own width (Tailwind's breakpoints), one below `sm`; or a fixed count.
     * @defaultValue `{ sm: 2, md: 4, lg: 6 }`
     */
    columns?: number | DashboardColumns | undefined;
    /**
     * Height of one grid row (any CSS length).
     * @defaultValue `'10rem'`
     */
    rowHeight?: string | undefined;
    /**
     * Edit mode. Bindable.
     * @defaultValue `false`
     */
    editing?: boolean | undefined;
    /**
     * Shows the Edit toggle.
     * @defaultValue `true`
     */
    editable?: boolean | undefined;
    /**
     * Tile heading level.
     * @defaultValue `2`
     */
    headingLevel?: HeadingLevel | undefined;
    /**
     * The region's name.
     * @defaultValue `'Dashboard'`
     */
    label?: string | undefined;
    /** @defaultValue `'Edit dashboard'` */
    editLabel?: string | undefined;
    /** @defaultValue `'Add widget'` */
    addLabel?: string | undefined;
    /** @defaultValue `'Reset layout'` */
    resetLabel?: string | undefined;
    /** @defaultValue `'Reset the dashboard layout?'` */
    resetTitle?: string | undefined;
    /** @defaultValue `'Every tile goes back to its default place and size, and removed tiles come back.'` */
    resetDescription?: string | undefined;
    /** @defaultValue `'Reset'` */
    resetConfirmLabel?: string | undefined;
    /** @defaultValue `'Cancel'` */
    cancelLabel?: string | undefined;
    /**
     * A tile's handle.
     * @defaultValue `` (title) => `Move ${title}` ``
     */
    moveLabel?: ((title: string) => string) | undefined;
    /**
     * A tile's menu.
     * @defaultValue `` (title) => `${title} options` ``
     */
    tileMenuLabel?: ((title: string) => string) | undefined;
    /**
     * The handles' keyboard help (their description).
     * @defaultValue `'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.'`
     */
    instructionsLabel?: string | undefined;
    /** @defaultValue `'Size'` */
    sizeLabel?: string | undefined;
    /** @defaultValue `{ sm: 'Small', md: 'Medium', lg: 'Large', wide: 'Wide', tall: 'Tall' }` */
    sizeLabels?: Readonly<Record<TileSize, string>> | undefined;
    /** @defaultValue `{ up: 'Move up', down: 'Move down', start: 'Move to start', end: 'Move to end' }` */
    moveLabels?: Readonly<Record<'up' | 'down' | 'start' | 'end', string>> | undefined;
    /** @defaultValue `'Remove from dashboard'` */
    hideLabel?: string | undefined;
    /** Live-region messages; any one can be replaced. Defaults are English. */
    announcements?: Partial<DashboardAnnouncements> | undefined;
  }

  let {
    tiles,
    layout = $bindable(),
    onLayoutChange,
    defaultLayout,
    columns = { sm: 2, md: 4, lg: 6 },
    rowHeight = '10rem',
    editing = $bindable(false),
    editable = true,
    headingLevel = 2,
    label = 'Dashboard',
    editLabel = 'Edit dashboard',
    addLabel = 'Add widget',
    resetLabel = 'Reset layout',
    resetTitle = 'Reset the dashboard layout?',
    resetDescription = 'Every tile goes back to its default place and size, and removed tiles come back.',
    resetConfirmLabel = 'Reset',
    cancelLabel = 'Cancel',
    moveLabel = (title) => `Move ${title}`,
    tileMenuLabel = (title) => `${title} options`,
    instructionsLabel = 'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.',
    sizeLabel = 'Size',
    sizeLabels = { sm: 'Small', md: 'Medium', lg: 'Large', wide: 'Wide', tall: 'Tall' },
    moveLabels = { up: 'Move up', down: 'Move down', start: 'Move to start', end: 'Move to end' },
    hideLabel = 'Remove from dashboard',
    announcements,
    id,
    class: className,
    ...rest
  }: Props = $props();

  const allSizes: readonly TileSize[] = ['sm', 'md', 'lg', 'wide', 'tall'];
  const uid = $props.id();
  const base = $derived(id ?? uid);
  const say = $derived({ ...defaultDashboardAnnouncements, ...announcements });

  // ── Columns and the layout on screen ──────────────────────────────────

  let width: number | undefined = $state();
  const widest = $derived(typeof columns === 'number' ? columns : widestColumns(columns));
  const current = $derived(
    typeof columns === 'number' || width === undefined ? widest : columnsAt(width, columns),
  );
  /** The grid is narrower than the stored layout, so moves reorder instead. */
  const reflowed = $derived(current !== widest);

  const sizesOf = (def: DashboardTile): readonly TileSize[] => def.sizes ?? allSizes;
  const spanOf = (def: DashboardTile) => tileSizes[sizesOf(def)[0] ?? 'sm'];
  const defs = $derived(new Map(tiles.map((def) => [def.id, def])));
  const stored = $derived(
    normaliseLayout(
      layout,
      tiles.map((def) => ({ id: def.id, span: spanOf(def) })),
      widest,
    ),
  );

  /** The tile being moved, the layout when it was picked up, and the layout on screen now. */
  let held:
    | { id: string; via: 'keyboard' | 'pointer'; origin: TileLayout[]; draft: TileLayout[] }
    | undefined = $state.raw();
  let message = $state('');

  const working = $derived(held?.draft ?? stored);
  const shown = $derived(reflowed ? reflow(working, current) : readingOrder(working));
  const cells = $derived(
    shown.flatMap((tile, index) => {
      const def = defs.get(tile.id);
      return def === undefined ? [] : [{ tile, def, index }];
    }),
  );
  const hidden = $derived(
    working.flatMap((tile) => {
      const def = tile.hidden === true ? defs.get(tile.id) : undefined;
      return def === undefined ? [] : [{ id: def.id, title: def.title }];
    }),
  );

  const titleOf = (tileId: string): string => defs.get(tileId)?.title ?? '';
  const positionOf = (order: readonly TileLayout[], tileId: string): number =>
    readingOrder(order).findIndex((tile) => tile.id === tileId);

  const commit = (next: TileLayout[]): void => {
    layout = next;
    onLayoutChange?.(next);
  };

  // ── Focus across re-renders ───────────────────────────────────────────

  const handles = new Map<string, HTMLElement>();
  const triggers = new Map<string, HTMLElement>();
  let addButton: HTMLElement | undefined;
  /** Set while a re-render moves a focused tile, so its blur is not a cancel. */
  let relocating = false;

  const register = (map: Map<string, HTMLElement>, key: string) => (element: HTMLElement) => {
    map.set(key, element);
    return () => {
      if (map.get(key) === element) map.delete(key);
    };
  };
  const registerAdd = (element: HTMLElement) => {
    addButton = element;
  };

  const refocus = async (target: () => HTMLElement | undefined): Promise<void> => {
    relocating = true;
    await tick();
    target()?.focus();
    relocating = false;
  };

  // ── Narration ─────────────────────────────────────────────────────────

  /** Where tile `tileId` is in `order`: a cell on the full grid, a position on a narrower one. */
  const place = (order: readonly TileLayout[], tileId: string, inOrder = reflowed): string => {
    if (inOrder) {
      return say.position(positionOf(order, tileId) + 1, readingOrder(order).length);
    }
    const tile = order.find((each) => each.id === tileId);
    return tile === undefined ? '' : say.cell(tile.y + 1, tile.x + 1);
  };

  // ── Holding a tile ────────────────────────────────────────────────────

  const pickUp = (tileId: string, via: 'keyboard' | 'pointer'): void => {
    held = { id: tileId, via, origin: stored, draft: stored };
    message = say.pickedUp(titleOf(tileId), place(stored, tileId));
  };

  const update = (next: TileLayout[]): void => {
    if (held === undefined || sameLayout(next, held.draft)) return;
    const tileId = held.id;
    held = { ...held, draft: next };
    message = say.moved(titleOf(tileId), place(next, tileId));
    if (held.via === 'keyboard') void refocus(() => handles.get(tileId));
  };

  const release = (keep: boolean): void => {
    if (held === undefined) return;
    const { id: tileId, via, origin, draft } = held;
    const final = keep ? draft : origin;
    held = undefined;
    message = (keep ? say.dropped : say.cancelled)(titleOf(tileId), place(final, tileId));
    if (keep && !sameLayout(final, origin)) commit(final);
    if (via === 'keyboard') void refocus(() => handles.get(tileId));
  };

  const rtl = (): boolean => grid !== undefined && getComputedStyle(grid).direction === 'rtl';

  const keyTargets = (event: KeyboardEvent, tile: TileLayout): { x: number; y: number } | undefined => {
    const forward = rtl() ? -1 : 1;
    const steps: Record<string, { x: number; y: number }> = {
      ArrowUp: { x: tile.x, y: tile.y - 1 },
      ArrowDown: { x: tile.x, y: tile.y + 1 },
      ArrowLeft: { x: tile.x - forward, y: tile.y },
      ArrowRight: { x: tile.x + forward, y: tile.y },
    };
    return steps[event.key];
  };

  const orderTargets = (event: KeyboardEvent, at: number, total: number): number | undefined => {
    const earlier = rtl() ? 'ArrowRight' : 'ArrowLeft';
    const later = rtl() ? 'ArrowLeft' : 'ArrowRight';
    const steps: Record<string, number> = {
      ArrowUp: at - 1,
      [earlier]: at - 1,
      ArrowDown: at + 1,
      [later]: at + 1,
      Home: 0,
      End: total - 1,
    };
    return steps[event.key];
  };

  const step = (event: KeyboardEvent, tileId: string, order: TileLayout[]): boolean => {
    if (reflowed) {
      const total = readingOrder(order).length;
      const to = orderTargets(event, positionOf(order, tileId), total);
      if (to === undefined) return false;
      update(moveInOrder(order, tileId, Math.min(Math.max(to, 0), total - 1), widest));
      return true;
    }
    const tile = order.find((each) => each.id === tileId);
    const target = tile === undefined ? undefined : keyTargets(event, tile);
    if (target === undefined) return false;
    update(placeTile(order, tileId, target, widest));
    return true;
  };

  const onHandleClick = (event: MouseEvent, tileId: string): void => {
    // A pointer's click (detail ≥ 1) ends a press or a drag, not a pick-up.
    if (event.detail !== 0) return;
    if (held === undefined) pickUp(tileId, 'keyboard');
    else if (held.id === tileId && held.via === 'keyboard') release(true);
  };

  const onHandleKeydown = (event: KeyboardEvent, tileId: string): void => {
    if (held?.id !== tileId || held.via !== 'keyboard') return;
    if (event.key === 'Escape') release(false);
    else if (!step(event, tileId, held.draft)) return;
    event.preventDefault();
  };

  const onHandleBlur = (tileId: string): void => {
    if (!relocating && held?.id === tileId && held.via === 'keyboard') release(false);
  };

  // ── Pointer ───────────────────────────────────────────────────────────

  let grid: HTMLElement | undefined = $state();
  /** A press on a handle, with where the pointer sits on its tile. */
  let press:
    | { id: string; pointerId: number; x: number; y: number; left: number; right: number; top: number }
    | undefined;
  let pointer = { x: 0, y: 0 };
  let frame: number | undefined;

  const cellUnder = (): { x: number; y: number } | undefined => {
    if (grid === undefined || press === undefined) return undefined;
    const bounds = grid.getBoundingClientRect();
    const style = getComputedStyle(grid);
    const columnPitch = (bounds.width + (Number.parseFloat(style.columnGap) || 0)) / current;
    const rowPitch =
      (Number.parseFloat(style.gridAutoRows) || 160) + (Number.parseFloat(style.rowGap) || 0);
    const leading = rtl()
      ? bounds.right - (pointer.x + press.right)
      : pointer.x + press.left - bounds.left;
    return {
      x: Math.round(leading / columnPitch),
      y: Math.round((pointer.y + press.top - bounds.top) / rowPitch),
    };
  };

  const follow = (): void => {
    const target = cellUnder();
    if (held?.via !== 'pointer' || target === undefined) return;
    update(placeTile(held.origin, held.id, target, widest));
  };

  const autoScroll = (): void => {
    if (held?.via !== 'pointer') return;
    const delta = edgeScroll(pointer.y, 0, innerHeight);
    if (delta !== 0) {
      scrollBy({ top: delta });
      follow();
    }
    frame = requestAnimationFrame(autoScroll);
  };

  const endPress = (): void => {
    press = undefined;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };

  const onHandlePointerDown = (event: PointerEvent, tileId: string): void => {
    if (event.button !== 0 || held !== undefined || reflowed) return;
    const tile = (event.currentTarget as HTMLElement).closest('section');
    if (tile === null) return;
    const box = tile.getBoundingClientRect();
    press = {
      id: tileId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: box.left - event.clientX,
      right: box.right - event.clientX,
      top: box.top - event.clientY,
    };
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (press?.pointerId !== event.pointerId) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (held !== undefined || startDrag(press)) follow();
  };

  /** Picks the pressed tile up once the pointer has travelled 4 px; whether it has. */
  const startDrag = (from: { id: string; x: number; y: number }): boolean => {
    if (Math.hypot(pointer.x - from.x, pointer.y - from.y) < 4) return false;
    pickUp(from.id, 'pointer');
    frame = requestAnimationFrame(autoScroll);
    return true;
  };

  const onPointerEnd = (event: PointerEvent, keep: boolean): void => {
    if (press === undefined || event.pointerId !== press.pointerId) return;
    endPress();
    if (held?.via === 'pointer') release(keep);
  };

  const onWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || held?.via !== 'pointer') return;
    event.preventDefault();
    endPress();
    release(false);
  };

  $effect(() => endPress);

  // ── Menu, toolbar and edit mode ───────────────────────────────────────

  const onSize = (tileId: string, size: string): void => {
    if (!isTileSize(size)) return;
    commit(resizeTile(stored, tileId, tileSizes[size], widest));
    message = say.resized(titleOf(tileId), sizeLabels[size]);
  };

  const onMove = (tileId: string, where: 'up' | 'down' | 'start' | 'end'): void => {
    const at = positionOf(stored, tileId);
    const to = { up: at - 1, down: at + 1, start: 0, end: Infinity }[where];
    const next = moveInOrder(stored, tileId, to, widest);
    commit(next);
    message = say.moved(titleOf(tileId), place(next, tileId, true));
    void refocus(() => triggers.get(tileId));
  };

  const onRemove = (tileId: string): void => {
    commit(hideTile(stored, tileId, widest));
    message = say.removed(titleOf(tileId));
    void refocus(() => addButton);
  };

  const onAdd = (tileId: string): void => {
    commit(showTile(stored, tileId, widest));
    message = say.added(titleOf(tileId));
    void refocus(() => handles.get(tileId));
  };

  const onReset = (): void => {
    if (defaultLayout === undefined) return;
    commit([...defaultLayout]);
    message = say.reset();
  };

  const onEditingChange = (next: boolean): void => {
    if (!next) {
      endPress();
      release(false);
    }
    editing = next;
  };

  const measure = (element: HTMLElement) => {
    // Read on the next frame: a column change resizes the grid, and setting
    // it inside the callback would re-enter the observer in the same frame.
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        const next = entry.contentRect.width;
        requestAnimationFrame(() => {
          width = next;
        });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  };

  const sizeOptions = (def: DashboardTile) =>
    sizesOf(def).map((size) => ({ value: size, label: sizeLabels[size] }));
  const sizeNow = (tileId: string, def: DashboardTile): string => {
    const tile = stored.find((each) => each.id === tileId);
    return tile === undefined ? '' : (sizeOf(tile, sizesOf(def), widest) ?? '');
  };
</script>

<svelte:window
  onkeydown={onWindowKeydown}
  onpointermove={onPointerMove}
  onpointerup={(event) => onPointerEnd(event, true)}
  onpointercancel={(event) => onPointerEnd(event, false)}
/>

<section {...rest} id={base} aria-label={label} class={['flex flex-col gap-3', className]}>
  {#if editable}
    <DashboardToolbar
      {editing}
      {onEditingChange}
      {hidden}
      canReset={defaultLayout !== undefined}
      {editLabel}
      {addLabel}
      {resetLabel}
      {resetTitle}
      {resetDescription}
      {resetConfirmLabel}
      {cancelLabel}
      {registerAdd}
      {onAdd}
      {onReset}
    />
  {/if}
  <div
    {@attach measure}
    bind:this={grid}
    class={['gap-4', held?.via === 'pointer' && 'select-none']}
    style:display="grid"
    style:grid-template-columns="repeat({current}, minmax(0, 1fr))"
    style:grid-auto-rows={rowHeight}
  >
    {#each cells as { tile, def, index } (tile.id)}
      {@const dragging = held?.id === tile.id}
      <section
        aria-labelledby="{base}-{tile.id}-title"
        animate:flip={{ duration: prefersReducedMotion.current ? 0 : 150 }}
        class={[
          'card bg-base-100 border-base-300 flex min-h-0 flex-col gap-2 border p-3',
          dragging && 'ring-primary z-10 border-dashed shadow-lg ring-2',
        ]}
        style:grid-column="{tile.x + 1} / span {tile.w}"
        style:grid-row="{tile.y + 1} / span {tile.h}"
        style:display="flex"
        style:flex-direction="column"
        style:min-height="0"
        style:overflow="hidden"
      >
        <DashboardTileHeader
          title={def.title}
          headingId="{base}-{tile.id}-title"
          {headingLevel}
          editing={editing && editable}
          held={dragging}
          busy={held !== undefined}
          first={index === 0}
          last={index === cells.length - 1}
          handleLabel={moveLabel(def.title)}
          menuLabel={tileMenuLabel(def.title)}
          instructionsId="{base}-instructions"
          sizes={sizeOptions(def)}
          size={sizeNow(tile.id, def)}
          {sizeLabel}
          {moveLabels}
          removeLabel={hideLabel}
          registerHandle={register(handles, tile.id)}
          registerTrigger={register(triggers, tile.id)}
          onHandleClick={(event) => onHandleClick(event, tile.id)}
          onHandleKeydown={(event) => onHandleKeydown(event, tile.id)}
          onHandleBlur={() => onHandleBlur(tile.id)}
          onHandlePointerDown={(event) => onHandlePointerDown(event, tile.id)}
          onSize={(size) => onSize(tile.id, size)}
          onMove={(where) => onMove(tile.id, where)}
          onRemove={() => onRemove(tile.id)}
        />
        <div class="min-h-0 flex-1 overflow-auto" style:min-height="0" style:flex="1" style:overflow="auto">
          {@render def.content()}
        </div>
      </section>
    {/each}
  </div>
  {#if editing && editable}
    <VisuallyHidden id="{base}-instructions">{instructionsLabel}</VisuallyHidden>
  {/if}
  <div aria-live="polite" aria-atomic="true" class="sr-only">{message}</div>
</section>
