/**
 * The arithmetic behind `WheelPicker`: stepping over disabled options,
 * typeahead, snapping a scroll offset to a row, and the numeric range a
 * column reports as a spinbutton. No DOM, so it is tested directly.
 *
 * @module
 */

/** One row of a wheel column. */
export interface WheelOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean | undefined;
}

/** One wheel column: a spinbutton named by `label`. */
export interface WheelColumnDef {
  readonly id: string;
  readonly label: string;
  readonly options: readonly WheelOption[];
  /** Arrow keys wrap from the last option to the first. */
  readonly loop?: boolean | undefined;
}

/** The selected value per column id. */
export type WheelValue = Readonly<Record<string, string>>;

const enabled = (options: readonly WheelOption[], index: number): boolean =>
  options[index] !== undefined && options[index].disabled !== true;

/**
 * The index `by` enabled options from `from` (negative is earlier), clamped
 * at the ends or wrapped with `loop`. Disabled options are stepped over;
 * `from` itself when nothing enabled lies that way.
 */
export const stepIndex = (
  options: readonly WheelOption[],
  from: number,
  by: number,
  loop = false,
): number => {
  const { length } = options;
  const direction = Math.sign(by);
  let index = from;
  let remaining = Math.abs(by);
  let found = from;
  for (let tries = 0; remaining > 0 && tries < length * Math.abs(by); tries += 1) {
    index += direction;
    if (loop) index = (index + length) % length;
    if (index < 0 || index >= length) break;
    if (enabled(options, index)) {
      found = index;
      remaining -= 1;
    }
  }
  return found;
};

/** The first (`1`) or last (`-1`) enabled index, or `-1` when none is. */
export const edgeIndex = (options: readonly WheelOption[], from: 1 | -1): number => {
  const indices = options.map((_, index) => index).filter((index) => enabled(options, index));
  return (from === 1 ? indices[0] : indices.at(-1)) ?? -1;
};

/** The enabled index closest to `index`, earlier on a tie. */
export const nearestEnabled = (options: readonly WheelOption[], index: number): number => {
  for (let distance = 0; distance < options.length; distance += 1) {
    if (enabled(options, index - distance)) return index - distance;
    if (enabled(options, index + distance)) return index + distance;
  }
  return -1;
};

/** The next enabled option after `from`, cycling, whose label starts with `query`. */
export const typeaheadIndex = (
  options: readonly WheelOption[],
  from: number,
  query: string,
): number => {
  const needle = query.toLocaleLowerCase();
  const { length } = options;
  for (let offset = 1; offset <= length; offset += 1) {
    const index = (from + offset) % length;
    if (enabled(options, index) && options[index]?.label.toLocaleLowerCase().startsWith(needle)) {
      return index;
    }
  }
  return -1;
};

/** The row centred at `scrollTop`, for rows `rowHeight` tall, within the list. */
export const rowAt = (scrollTop: number, rowHeight: number, count: number): number =>
  rowHeight <= 0 ? 0 : Math.min(Math.max(Math.round(scrollTop / rowHeight), 0), count - 1);

/** `{ now, min, max }` when every option's value is a number; otherwise `undefined`. */
export const numericRange = (
  options: readonly WheelOption[],
  value: string,
): { now: number; min: number; max: number } | undefined => {
  const numbers = options.map((option) => Number(option.value));
  const now = Number(value);
  if (
    options.length === 0 ||
    options.some((option) => option.value.trim() === '') ||
    !numbers.every(Number.isFinite)
  ) {
    return undefined;
  }
  return { now, min: Math.min(...numbers), max: Math.max(...numbers) };
};

/** The page step for PageUp / PageDown. */
export const WHEEL_PAGE = 5;

/**
 * What a key does on a wheel column: the index it moves to (`-1` when
 * nothing enabled lies that way), `'type'` for a printable character, or
 * `undefined` when the column ignores it.
 */
export const wheelKeyTarget = (
  options: readonly WheelOption[],
  index: number,
  event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'>,
  loop = false,
): number | 'type' | undefined => {
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined;
  const moves: Record<string, () => number> = {
    ArrowUp: () => stepIndex(options, index, -1, loop),
    ArrowDown: () => stepIndex(options, index, 1, loop),
    PageUp: () => stepIndex(options, index, -WHEEL_PAGE),
    PageDown: () => stepIndex(options, index, WHEEL_PAGE),
    Home: () => edgeIndex(options, 1),
    End: () => edgeIndex(options, -1),
  };
  const move = moves[event.key];
  if (move !== undefined) return move();
  return event.key.length === 1 ? 'type' : undefined;
};
