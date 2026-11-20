/**
 * The typeahead `Listbox` and `Cascader`'s columns share: letters typed
 * within half a second build one query, matched against the start of each
 * enabled label.
 *
 * @module
 */

/** One list's typeahead: call it with each typed key; it returns the index to move to. */
export type Typeahead = (
  key: string,
  labels: readonly string[],
  enabled: (index: number) => boolean,
  from: number,
) => number | undefined;

export const createTypeahead = (now: () => number = Date.now): Typeahead => {
  let typed = '';
  let typedAt = 0;
  return (key, labels, enabled, from) => {
    const time = now();
    typed = time - typedAt > 500 ? key : typed + key;
    typedAt = time;
    const query = typed.toLowerCase();
    const count = labels.length;
    // A repeated single letter cycles; a longer query re-checks from the current one.
    const offset = typed.length === 1 ? 1 : 0;
    for (let step = 0; step < count; step += 1) {
      const index = (Math.max(from, 0) + offset + step) % count;
      if (enabled(index) && labels[index]?.toLowerCase().startsWith(query) === true) return index;
    }
    return undefined;
  };
};
