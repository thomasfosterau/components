/**
 * `TransferList`'s list arithmetic, kept pure so it is tested without a
 * browser.
 *
 * @module
 */

/**
 * `items` with every entry in `picked` moved one place `direction`. Picked
 * entries move as a block: one already at the edge, or against a picked
 * neighbour that cannot move, stays put. `items` itself is not touched.
 */
export const shiftPicked = (
  items: readonly string[],
  picked: ReadonlySet<string>,
  direction: 'up' | 'down',
): string[] => {
  const next = [...items];
  const step = direction === 'up' ? -1 : 1;
  const indexes = next.map((_, index) => index);
  const order = direction === 'up' ? indexes : indexes.toReversed();
  for (const index of order) {
    const item = next[index];
    const neighbour = next[index + step];
    if (item === undefined || neighbour === undefined) continue;
    if (picked.has(item) && !picked.has(neighbour)) {
      next[index] = neighbour;
      next[index + step] = item;
    }
  }
  return next;
};

/** Whether `shiftPicked` would change anything. */
export const canShift = (
  items: readonly string[],
  picked: ReadonlySet<string>,
  direction: 'up' | 'down',
): boolean => shiftPicked(items, picked, direction).some((item, index) => item !== items[index]);
