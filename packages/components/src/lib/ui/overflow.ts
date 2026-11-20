/**
 * The fit algorithm behind `Overflow`: given each item's measured width,
 * which ones to move into the "More" menu. Pure, so the component only
 * measures and renders.
 *
 * @module
 */

/** Which end of the row collapses first. `middle` keeps the first and last items (breadcrumbs). */
export type CollapseFrom = 'end' | 'start' | 'middle';

/** One item as the algorithm sees it. */
export interface FitItem {
  /** Its rendered width in CSS pixels. */
  readonly width: number;
  /** Higher stays visible longer; ties break by position. */
  readonly priority: number;
  /** Never moved into the menu. */
  readonly pinned: boolean;
}

/** The row the items must fit into. */
export interface FitRoom {
  /** The container's inner width. */
  readonly available: number;
  /** The "More" trigger's width. */
  readonly moreWidth: number;
  /** The gap between items. */
  readonly gap: number;
  readonly collapseFrom: CollapseFrom;
  /** Never show fewer items than this (pinned items count). */
  readonly minVisible: number;
}

function rowWidth(widths: readonly number[], gap: number): number {
  return widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
}

/** How soon an unpinned item at `index` should go, lower first, before priority breaks the tie. */
function positionRank(index: number, count: number, collapseFrom: CollapseFrom): number {
  if (collapseFrom === 'start') return index;
  if (collapseFrom === 'end') return count - 1 - index;
  return Math.abs(index - (count - 1) / 2) * 2 + (index < (count - 1) / 2 ? 0 : 1);
}

/**
 * The indexes of the items to hide, removing the lowest priority first and,
 * among equals, those nearest the collapsing end, until the rest and the
 * "More" trigger fit. Empty when everything fits.
 */
export function hiddenIndexes(items: readonly FitItem[], room: FitRoom): ReadonlySet<number> {
  const hidden = new Set<number>();
  const fits = (withMore: boolean): boolean => {
    const visible = items.filter((_, index) => !hidden.has(index)).map((item) => item.width);
    const more = withMore ? room.moreWidth + (visible.length > 0 ? room.gap : 0) : 0;
    return rowWidth(visible, room.gap) + more <= room.available;
  };
  if (fits(false)) return hidden;

  const last = items.length - 1;
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item, index }) =>
        !item.pinned && !(room.collapseFrom === 'middle' && (index === 0 || index === last)),
    )
    .toSorted(
      (a, b) =>
        a.item.priority - b.item.priority ||
        positionRank(a.index, items.length, room.collapseFrom) -
          positionRank(b.index, items.length, room.collapseFrom),
    );

  for (const { index } of candidates) {
    if (fits(true) || items.length - hidden.size <= room.minVisible) break;
    hidden.add(index);
  }
  return hidden;
}

/** Where the "More" trigger goes among the items: before this index (`items.length` for the end). */
export function triggerSlot(
  hidden: ReadonlySet<number>,
  count: number,
  collapseFrom: CollapseFrom,
): number {
  if (hidden.size === 0) return count;
  if (collapseFrom === 'start') return 0;
  if (collapseFrom === 'middle') return Math.min(...hidden);
  return count;
}
