/**
 * `DashboardGrid`'s layout model: tiles on a column grid, moved with
 * collision and upward compaction, reordered by flow packing, and reflowed
 * to fewer columns. Pure functions over plain objects, so each is tested
 * without a browser.
 *
 * @module
 */

import type { Snippet } from 'svelte';

/** Where one tile sits, in grid cells. `x` and `y` are 0-based; `w` and `h` are spans. */
export interface TileLayout {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Removed from the dashboard; "Add widget" brings it back. */
  readonly hidden?: boolean | undefined;
}

/** A tile's size presets, as column × row spans (see `tileSizes`). */
export type TileSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

/** One `DashboardGrid` tile: its content and the sizes it offers. */
export interface DashboardTile {
  readonly id: string;
  /** The tile's heading, and its name in controls and announcements. */
  readonly title: string;
  /** The size presets its menu offers; the first is its size when it has no layout entry. */
  readonly sizes?: readonly TileSize[] | undefined;
  readonly content: Snippet<[]>;
}

/** The spans each size preset sets; a span wider than the grid is clamped to it. */
export const tileSizes: Readonly<Record<TileSize, { readonly w: number; readonly h: number }>> = {
  sm: { w: 1, h: 1 },
  md: { w: 2, h: 1 },
  lg: { w: 2, h: 2 },
  wide: { w: 4, h: 1 },
  tall: { w: 1, h: 2 },
};

/** Whether `value` names a size preset. */
export const isTileSize = (value: string): value is TileSize => Object.hasOwn(tileSizes, value);

/** The preset whose spans `tile` has, clamped to `columns`, if any. */
export const sizeOf = (
  tile: TileLayout,
  sizes: readonly TileSize[],
  columns: number,
): TileSize | undefined =>
  sizes.find(
    (size) => Math.min(tileSizes[size].w, columns) === tile.w && tileSizes[size].h === tile.h,
  );

/** Whether two tiles share a cell. */
export const overlaps = (a: TileLayout, b: TileLayout): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Top to bottom, then start to end: the order tiles are read and tabbed in. */
export const byReadingOrder = (a: TileLayout, b: TileLayout): number => a.y - b.y || a.x - b.x;

/** The shown tiles in reading order. */
export const readingOrder = (layout: readonly TileLayout[]): TileLayout[] =>
  layout.filter((tile) => tile.hidden !== true).toSorted(byReadingOrder);

const clamp = (tile: TileLayout, columns: number): TileLayout => {
  const w = Math.min(Math.max(1, Math.trunc(tile.w)), columns);
  return {
    ...tile,
    w,
    h: Math.max(1, Math.trunc(tile.h)),
    x: Math.min(Math.max(0, Math.trunc(tile.x)), columns - w),
    y: Math.max(0, Math.trunc(tile.y)),
  };
};

const hits = (placed: readonly TileLayout[], tile: TileLayout): boolean =>
  placed.some((other) => overlaps(other, tile));

/** `tile` moved down to the first row at or below it where it hits nothing in `placed`. */
const pushDown = (placed: readonly TileLayout[], tile: TileLayout): TileLayout => {
  let y = tile.y;
  while (hits(placed, { ...tile, y })) y += 1;
  return { ...tile, y };
};

/** `tile` moved up while the row above it is free; it never jumps over another tile. */
const floatUp = (placed: readonly TileLayout[], tile: TileLayout): TileLayout => {
  let y = tile.y;
  while (y > 0 && !hits(placed, { ...tile, y: y - 1 })) y -= 1;
  return { ...tile, y };
};

const hiddenOf = (layout: readonly TileLayout[]): TileLayout[] =>
  layout.filter((tile) => tile.hidden === true);

const lay = (
  tiles: readonly TileLayout[],
  columns: number,
  settle: (placed: readonly TileLayout[], tile: TileLayout) => TileLayout,
): TileLayout[] => {
  const placed: TileLayout[] = [];
  for (const tile of tiles.toSorted(byReadingOrder))
    placed.push(settle(placed, clamp(tile, columns)));
  return placed;
};

/** Every shown tile floated up as far as it goes, in reading order; hidden tiles kept as they are. */
export const compact = (layout: readonly TileLayout[], columns: number): TileLayout[] => [
  ...lay(readingOrder(layout), columns, floatUp).toSorted(byReadingOrder),
  ...hiddenOf(layout),
];

/** Tiles clamped into `columns` and any overlap pushed down; nothing moves up. */
export const settleLayout = (layout: readonly TileLayout[], columns: number): TileLayout[] => [
  ...lay(readingOrder(layout), columns, pushDown).toSorted(byReadingOrder),
  ...hiddenOf(layout),
];

/**
 * Moves tile `id` to cell `target`. The first tile it lands on takes its old
 * cell when it fits there (a swap); any other it lands on is pushed down.
 * Then the grid is compacted upward.
 */
export const placeTile = (
  layout: readonly TileLayout[],
  id: string,
  target: { readonly x: number; readonly y: number },
  columns: number,
): TileLayout[] => {
  const moving = layout.find((tile) => tile.id === id && tile.hidden !== true);
  if (moving === undefined) return [...layout];
  const origin = clamp(moving, columns);
  const placed: TileLayout[] = [clamp({ ...moving, ...target }, columns)];
  let swapped = false;
  for (const tile of readingOrder(layout)) {
    if (tile.id === id) continue;
    const here = clamp(tile, columns);
    const there = clamp({ ...here, x: origin.x, y: origin.y }, columns);
    if (!hits(placed, here)) placed.push(here);
    else if (!swapped && !hits(placed, there)) {
      swapped = true;
      placed.push(there);
    } else placed.push(pushDown(placed, here));
  }
  return compact([...placed, ...hiddenOf(layout)], columns);
};

/** Tile `id` given new spans in place; whatever it now covers is pushed down, then the grid compacted. */
export const resizeTile = (
  layout: readonly TileLayout[],
  id: string,
  span: { readonly w: number; readonly h: number },
  columns: number,
): TileLayout[] => {
  const resizing = layout.find((tile) => tile.id === id && tile.hidden !== true);
  if (resizing === undefined) return [...layout];
  const placed: TileLayout[] = [clamp({ ...resizing, ...span }, columns)];
  for (const tile of readingOrder(layout)) {
    if (tile.id !== id) placed.push(pushDown(placed, clamp(tile, columns)));
  }
  return compact([...placed, ...hiddenOf(layout)], columns);
};

/**
 * Tiles laid out in the given order by flow packing: each goes in the first
 * cell after the one before it where it fits, as CSS grid's sparse
 * auto-placement does, from row `top`. Reading order always equals `tiles` order.
 */
export const pack = (tiles: readonly TileLayout[], columns: number, top = 0): TileLayout[] => {
  const placed: TileLayout[] = [];
  let cursor = { x: 0, y: top };
  for (const tile of tiles) {
    const w = Math.min(Math.max(1, tile.w), columns);
    let { x, y } = cursor;
    while (x + w > columns || hits(placed, { ...tile, w, x, y })) {
      x += 1;
      if (x + w > columns) {
        x = 0;
        y += 1;
      }
    }
    placed.push({ ...tile, w, h: Math.max(1, tile.h), x, y });
    cursor = { x: x + w, y };
  }
  return placed;
};

/** The shown tiles repacked in reading order into `columns`, for a narrower screen. */
export const reflow = (layout: readonly TileLayout[], columns: number): TileLayout[] =>
  pack(readingOrder(layout), columns);

/** Tile `id` moved to `index` in reading order; the shown tiles are repacked to keep that order. */
export const moveInOrder = (
  layout: readonly TileLayout[],
  id: string,
  index: number,
  columns: number,
): TileLayout[] => {
  const order = readingOrder(layout);
  const from = order.findIndex((tile) => tile.id === id);
  if (from < 0) return [...layout];
  const [moving] = order.splice(from, 1);
  if (moving !== undefined) order.splice(Math.min(Math.max(index, 0), order.length), 0, moving);
  return [...pack(order, columns), ...hiddenOf(layout)];
};

/** Tile `id` removed from the dashboard, and the rest compacted. */
export const hideTile = (
  layout: readonly TileLayout[],
  id: string,
  columns: number,
): TileLayout[] =>
  compact(
    layout.map((tile) => (tile.id === id ? { ...tile, hidden: true } : tile)),
    columns,
  );

/** The first row below every shown tile. */
const bottom = (layout: readonly TileLayout[]): number =>
  Math.max(0, ...readingOrder(layout).map((tile) => tile.y + tile.h));

/** Hidden tile `id` shown again, on a new row at the end. */
export const showTile = (
  layout: readonly TileLayout[],
  id: string,
  columns: number,
): TileLayout[] => {
  const y = bottom(layout);
  return layout.map((tile) =>
    tile.id === id ? clamp({ ...tile, hidden: false, x: 0, y }, columns) : tile,
  );
};

/**
 * `layout` made safe to draw for these tiles: entries for unknown ids
 * dropped, a tile with no entry appended at its default span, everything
 * clamped into `columns` and overlaps pushed down.
 */
export const normaliseLayout = (
  layout: readonly TileLayout[],
  tiles: readonly {
    readonly id: string;
    readonly span: { readonly w: number; readonly h: number };
  }[],
  columns: number,
): TileLayout[] => {
  const known = new Set(tiles.map((tile) => tile.id));
  const kept = layout.filter((tile) => known.has(tile.id));
  const present = new Set(kept.map((tile) => tile.id));
  const missing = tiles.filter((tile) => !present.has(tile.id));
  const settled = settleLayout(kept, columns);
  const appended = pack(
    missing.map((tile) => ({ id: tile.id, x: 0, y: 0, w: tile.span.w, h: tile.span.h })),
    columns,
    bottom(settled),
  );
  return [...settled, ...appended];
};

/** Whether two layouts place every tile the same. */
export const sameLayout = (a: readonly TileLayout[], b: readonly TileLayout[]): boolean =>
  a.length === b.length &&
  a.every((tile) => {
    const other = b.find((candidate) => candidate.id === tile.id);
    return (
      other !== undefined &&
      other.x === tile.x &&
      other.y === tile.y &&
      other.w === tile.w &&
      other.h === tile.h &&
      (other.hidden === true) === (tile.hidden === true)
    );
  });

/** Breakpoints `DashboardGrid` reads its column count at, by the grid's own width (Tailwind's). */
export const dashboardBreakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

const breakpointNames = ['sm', 'md', 'lg', 'xl'] as const;

/** A column count per breakpoint; below the smallest, the grid is one column. */
export type DashboardColumns = Partial<Record<keyof typeof dashboardBreakpoints, number>>;

/** The column count for a grid `width` px wide. */
export const columnsAt = (width: number, columns: DashboardColumns): number => {
  let count = 1;
  for (const name of breakpointNames) {
    const at = columns[name];
    if (at !== undefined && width >= dashboardBreakpoints[name]) count = at;
  }
  return count;
};

/** The widest column count `columns` reaches; the layout is stored at this width. */
export const widestColumns = (columns: DashboardColumns): number =>
  Math.max(1, ...Object.values(columns).filter((value) => value !== undefined));

/**
 * The live-region messages `DashboardGrid` announces. A `place` is `cell`'s
 * text on the full grid, or `position`'s on a narrower one, where tiles
 * reorder instead of moving in two dimensions.
 */
export interface DashboardAnnouncements {
  /** A grid cell, 1-based. */
  readonly cell: (row: number, column: number) => string;
  /** A place in reading order, 1-based. */
  readonly position: (position: number, total: number) => string;
  /** A tile was picked up by its Move handle. */
  readonly pickedUp: (name: string, place: string) => string;
  /** A tile moved: held, or through its menu. */
  readonly moved: (name: string, place: string) => string;
  /** A held tile was put down. */
  readonly dropped: (name: string, place: string) => string;
  /** A held tile went back where it was picked up (Escape). */
  readonly cancelled: (name: string, place: string) => string;
  /** A tile's size changed. */
  readonly resized: (name: string, size: string) => string;
  readonly removed: (name: string) => string;
  readonly added: (name: string) => string;
  readonly reset: () => string;
}

/** The English defaults; `DashboardGrid`'s `announcements` overrides any of them. */
export const defaultDashboardAnnouncements: DashboardAnnouncements = {
  cell: (row, column) => `row ${row}, column ${column}`,
  position: (position, total) => `position ${position} of ${total}`,
  pickedUp: (name, place) => `Picked up ${name} at ${place}.`,
  moved: (name, place) => `${name} moved to ${place}.`,
  dropped: (name, place) => `${name} dropped at ${place}.`,
  cancelled: (name, place) => `Move cancelled. ${name} returned to ${place}.`,
  resized: (name, size) => `${name} is now ${size}.`,
  removed: (name) => `${name} removed from the dashboard.`,
  added: (name) => `${name} added to the dashboard.`,
  reset: () => 'Dashboard layout reset.',
};
