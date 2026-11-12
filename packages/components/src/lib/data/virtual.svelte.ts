/**
 * The windowing maths behind `VirtualList`: where each row starts, which rows
 * a scroll position shows, and where to scroll to bring a row into view.
 *
 *   offsets     a prefix sum of row sizes, `count + 1` long: row `i` spans
 *               `[offsets[i], offsets[i + 1])` and `offsets[count]` is the
 *               whole list's size. A row with no measurement counts at the
 *               estimate, so fixed-height rows are the case where nothing is
 *               ever measured.
 *   indexAt     a binary search over the offsets, so finding the first visible
 *               row of 10,000 measured rows is fourteen comparisons.
 *   overscan    rows rendered beyond each edge of the viewport, so a fast
 *               scroll paints rows that are already there and a Page Down
 *               lands on a mounted neighbour.
 *
 * Measured sizes are keyed by the row's stable key, not its index, so
 * prepending or re-ordering rows keeps every measurement that still applies.
 *
 * The pure functions carry the maths and are tested on their own;
 * `VirtualWindow` is the reactive (`$state` / `$derived`) wrapper a component
 * reads straight into its template.
 *
 * @module
 */

/** A row's stable identity, as `VirtualList`'s `key` returns it. */
export type VirtualKey = string | number;

/**
 * Where a row lands when scrolled to: its top at the viewport's top, centred,
 * its bottom at the viewport's bottom, or `'auto'` — the least scroll that
 * makes it fully visible (none when it already is).
 */
export type VirtualAlign = 'start' | 'center' | 'end' | 'auto';

/** A half-open run of row indices, `[start, end)`. */
export interface VirtualRange {
  readonly start: number;
  readonly end: number;
}

/** Options for `VirtualListApi.scrollToIndex` / `scrollToKey`. */
export interface VirtualScrollOptions {
  /** Where the row lands. Defaults to `'auto'`. */
  readonly align?: VirtualAlign | undefined;
  /** Move focus to the row once it is in view. Defaults to `false`. */
  readonly focus?: boolean | undefined;
}

/** The handle `VirtualList` binds to its `api` prop. */
export interface VirtualListApi {
  /** Scroll row `index` (0-based, clamped to the list) into view. Resolves once it is rendered. */
  scrollToIndex(index: number, options?: VirtualScrollOptions): Promise<void>;
  /** Scroll the row with this key into view; does nothing for an unknown key. */
  scrollToKey(key: VirtualKey, options?: VirtualScrollOptions): Promise<void>;
}

/** `offsets[index]`, reading past either end as the nearest edge. */
export function offsetAt(offsets: Float64Array, index: number): number {
  const last = offsets.length - 1;
  return offsets[Math.min(Math.max(index, 0), last)] ?? 0;
}

/** The prefix sum of `count` row sizes: `count + 1` offsets, starting at 0. */
export function rowOffsets(count: number, sizeAt: (index: number) => number): Float64Array {
  const offsets = new Float64Array(Math.max(count, 0) + 1);
  let sum = 0;
  for (let index = 0; index < count; index += 1) {
    sum += sizeAt(index);
    offsets[index + 1] = sum;
  }
  return offsets;
}

/**
 * The row at `offset`: the last index whose start is at or before it, clamped
 * to `[0, count - 1]` (0 for an empty list).
 */
export function indexAt(offsets: Float64Array, offset: number): number {
  let low = 0;
  let high = offsets.length - 2;
  if (high <= 0) return 0;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (offsetAt(offsets, middle) <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * The rows to render for a viewport `viewportSize` tall whose top is
 * `scrollOffset` into the list, plus `overscan` beyond each edge. A viewport
 * wholly before or after the list still yields its nearest rows, so a list
 * scrolled past (or not yet reached) in a window scroller is never empty.
 */
export function visibleRange(
  offsets: Float64Array,
  scrollOffset: number,
  viewportSize: number,
  overscan: number,
): VirtualRange {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: 0 };
  const bottom = scrollOffset + Math.max(viewportSize, 0);
  const first = indexAt(offsets, scrollOffset);
  let last = indexAt(offsets, bottom);
  // A row that starts exactly at the bottom edge is not on screen.
  if (last > first && offsetAt(offsets, last) >= bottom) last -= 1;
  const extra = Math.max(Math.floor(overscan), 0);
  return { start: Math.max(first - extra, 0), end: Math.min(last + 1 + extra, count) };
}

/**
 * The scroll offset (into the list) that puts row `index` where `align`
 * says, given the viewport's current offset. Not clamped: the scroller clamps
 * it, and a window scroller may have page content past the list.
 */
export function alignedOffset(
  offsets: Float64Array,
  index: number,
  viewportSize: number,
  current: number,
  align: VirtualAlign,
): number {
  const start = offsetAt(offsets, index);
  const end = offsetAt(offsets, index + 1);
  switch (align) {
    case 'start':
      return start;
    case 'end':
      return end - viewportSize;
    case 'center':
      return start - (viewportSize - (end - start)) / 2;
    case 'auto':
      if (start < current) return start;
      if (end > current + viewportSize) return Math.min(start, end - viewportSize);
      return current;
  }
}

/**
 * One entry of a windowed body, in index order: a rendered row, or a spacer
 * standing in for the unrendered rows between two rendered ones.
 */
export type VirtualPart =
  | { readonly kind: 'row'; readonly index: number }
  | { readonly kind: 'spacer'; readonly size: number };

/**
 * What a windowed body renders: the rows in `range`, the `pinned` row (the
 * one holding focus) even when it is outside the range, and a spacer for
 * every gap, so DOM order is index order and the scroll height is the whole
 * list's. Shared by `VirtualList` and the virtual editing `DataGrid`.
 */
export function windowParts(
  offsets: Float64Array,
  range: VirtualRange,
  pinned: number | undefined,
): VirtualPart[] {
  const count = offsets.length - 1;
  const out: VirtualPart[] = [];
  let cursor = 0;
  const take = (from: number, to: number): void => {
    if (from > cursor) {
      out.push({ kind: 'spacer', size: offsetAt(offsets, from) - offsetAt(offsets, cursor) });
    }
    for (let index = Math.max(from, cursor); index < to; index += 1)
      out.push({ kind: 'row', index });
    cursor = Math.max(cursor, to);
  };
  const pin = pinned !== undefined && pinned >= 0 && pinned < count ? pinned : undefined;
  if (pin !== undefined && pin < range.start) take(pin, pin + 1);
  take(range.start, range.end);
  if (pin !== undefined && pin >= range.end) take(pin, pin + 1);
  if (cursor < count) {
    out.push({ kind: 'spacer', size: offsetAt(offsets, count) - offsetAt(offsets, cursor) });
  }
  return out;
}

/** Getters, so the component's current props are read at call time. */
export interface VirtualWindowOptions {
  readonly count: () => number;
  readonly keyAt: (index: number) => VirtualKey;
  readonly estimateSize: () => number;
  readonly overscan: () => number;
  readonly measure: () => boolean;
}

/** The reactive window over one list: set the scroll state, read the range. */
export class VirtualWindow {
  /** How far the viewport's top is into the list, in px (negative before it). */
  scrollOffset = $state(0);
  /** The viewport's height, in px. */
  viewportSize = $state(0);

  #options: VirtualWindowOptions;
  #sizes = new Map<VirtualKey, number>();
  /** Bumped on every new measurement, so `offsets` re-derives. */
  #version = $state(0);

  /** Every row's start, plus the total, from measurements and the estimate. */
  readonly offsets: Float64Array = $derived.by(() => {
    void this.#version;
    const estimate = this.#options.estimateSize();
    const { keyAt } = this.#options;
    if (!this.#options.measure()) return rowOffsets(this.#options.count(), () => estimate);
    return rowOffsets(this.#options.count(), (index) => this.#sizes.get(keyAt(index)) ?? estimate);
  });

  /** The rows to render. */
  readonly range: VirtualRange = $derived.by(() =>
    visibleRange(this.offsets, this.scrollOffset, this.viewportSize, this.#options.overscan()),
  );

  /** The whole list's size, in px. */
  readonly totalSize: number = $derived(offsetAt(this.offsets, this.offsets.length - 1));

  constructor(options: VirtualWindowOptions) {
    this.#options = options;
  }

  /** Record row `key`'s measured size; a repeat of the same size is a no-op. */
  setSize(key: VirtualKey, size: number): void {
    if (this.#sizes.get(key) === size) return;
    this.#sizes.set(key, size);
    this.#version += 1;
  }

  /** Where row `index` starts, in px into the list. */
  offsetOf(index: number): number {
    return offsetAt(this.offsets, index);
  }

  /** The rendered rows and spacers, keeping row `pinned` mounted wherever it is. */
  parts(pinned: number | undefined): VirtualPart[] {
    return windowParts(this.offsets, this.range, pinned);
  }

  /** The scroll offset that puts row `index` where `align` says. */
  alignedOffset(index: number, align: VirtualAlign): number {
    return alignedOffset(this.offsets, index, this.viewportSize, this.scrollOffset, align);
  }
}
