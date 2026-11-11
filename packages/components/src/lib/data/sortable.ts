/**
 * The arithmetic behind `SortableList`: moving one entry of an array, the
 * slot a pointer is over, how fast to scroll near an edge, and the English
 * announcements. Pure functions over numbers and arrays, so each is tested
 * without a browser and none touches the DOM.
 *
 * @module
 */

/**
 * The live-region messages `SortableList` announces. Positions are 1-based,
 * as a reader counts them; `total` is the length of the list.
 */
export interface SortableAnnouncements {
  /** An item was picked up (Space/Enter on its handle, or a drag began). */
  readonly pickedUp: (name: string, position: number, total: number) => string;
  /** A held item, or one moved through the move menu, now sits at `position`. */
  readonly moved: (name: string, position: number, total: number) => string;
  /** A held item was put down at `position`. */
  readonly dropped: (name: string, position: number, total: number) => string;
  /** A held item was put back where it was picked up (Escape). */
  readonly cancelled: (name: string, position: number) => string;
  /** `onReorder` rejected, so the move was undone and the item is back at `position`. */
  readonly failed: (name: string, position: number) => string;
}

/** The English defaults; `SortableList`'s `announcements` overrides any of them. */
export const defaultSortableAnnouncements: SortableAnnouncements = {
  pickedUp: (name, position, total) => `Picked up ${name}. Position ${position} of ${total}.`,
  moved: (name, position, total) => `${name} moved to position ${position} of ${total}.`,
  dropped: (name, position, total) => `${name} dropped at position ${position} of ${total}.`,
  cancelled: (name, position) => `Reorder cancelled. ${name} returned to position ${position}.`,
  failed: (name, position) => `Could not move ${name}. It is back at position ${position}.`,
};

/**
 * A copy of `items` with the entry at `from` moved to index `to`; `items`
 * itself is not touched. `to` is clamped into the array, so `move(xs, i,
 * Infinity)` moves to the end. An integer `from` outside the array is a
 * caller bug and throws.
 */
export const move = <T>(items: readonly T[], from: number, to: number): T[] => {
  if (!Number.isInteger(from) || from < 0 || from >= items.length) {
    throw new RangeError(`move: index ${from} is outside a list of ${items.length}`);
  }
  const next = [...items];
  // One element, since `from` is in range; kept as an array so an entry that
  // is itself `undefined` survives the move.
  const moved = next.splice(from, 1);
  const target = Math.min(Math.max(Number.isNaN(to) ? from : Math.trunc(to), 0), next.length);
  next.splice(target, 0, ...moved);
  return next;
};

/**
 * The index a dragged item belongs at: how many of the OTHER rows' centres
 * the pointer has passed, in reading order. `centres` are those rows'
 * centres along the list's axis, in list order and in the same coordinates
 * as `pointer`; `reversed` is a horizontal list in a right-to-left
 * direction, where "passed" means "to the left of".
 */
export const slotAt = (centres: readonly number[], pointer: number, reversed = false): number =>
  centres.filter((centre) => (reversed ? pointer < centre : pointer > centre)).length;

/**
 * How far to scroll this frame while dragging near an edge of a scroller
 * that runs from `start` to `end`: negative within `edge` px of the start,
 * positive within `edge` px of the end, zero otherwise, scaled up to
 * `speed` px as the pointer nears (or passes) the edge.
 */
export const edgeScroll = (
  pointer: number,
  start: number,
  end: number,
  edge = 40,
  speed = 16,
): number => {
  if (end - start <= edge * 2) return 0;
  const intoStart = start + edge - pointer;
  if (intoStart > 0) return -Math.ceil(speed * Math.min(intoStart / edge, 1));
  const intoEnd = pointer - (end - edge);
  if (intoEnd > 0) return Math.ceil(speed * Math.min(intoEnd / edge, 1));
  return 0;
};
