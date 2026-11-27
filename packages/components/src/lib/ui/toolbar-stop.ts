/**
 * Which control of an overflowing `Toolbar` holds its one Tab stop.
 *
 * bits-ui's roving tabindex remembers the stop by element and moves it only
 * on an arrow key, so a stop that moves into the "More" menu, or a "More"
 * trigger that goes away, would leave the toolbar with no Tab stop at all.
 * An overflowing toolbar owns the stop instead: the control focused last,
 * else the first visible, enabled one. Arrow keys stay bits-ui's.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

const TOOLBAR_STOP_KEY = Symbol.for('@thomasfosterau/components/toolbar-stop');

/** The "More" trigger's key, which no item id can equal. */
export const MORE_STOP: unique symbol = Symbol('more');

/** A control's key: its `Overflow` item id, or {@link MORE_STOP}. */
export type StopKey = string | typeof MORE_STOP;

/** What an overflowing `Toolbar` lends its controls. */
export interface ToolbarStop {
  /** `0` for the control that holds the Tab stop, `-1` for the rest. */
  readonly tabIndex: (key: StopKey) => 0 | -1;
}

/** One item as {@link resolveStop} sees it. */
export interface StopCandidate {
  readonly id: string;
  readonly disabled?: boolean | undefined;
}

/** The control that holds the stop: `wanted` while it is visible and enabled, else the first one that is. */
export function resolveStop(
  wanted: StopKey | undefined,
  items: readonly StopCandidate[],
  hidden: ReadonlySet<string>,
): StopKey | undefined {
  const usable = (item: StopCandidate): boolean => item.disabled !== true && !hidden.has(item.id);
  if (wanted === MORE_STOP && hidden.size > 0) return MORE_STOP;
  if (typeof wanted === 'string' && items.some((item) => item.id === wanted && usable(item)))
    return wanted;
  return items.find(usable)?.id ?? (hidden.size > 0 ? MORE_STOP : undefined);
}

/** Lend `stop` to the controls below. */
export function setToolbarStop(stop: ToolbarStop): void {
  setContext(TOOLBAR_STOP_KEY, stop);
}

/** The enclosing overflowing `Toolbar`'s stop; `undefined` anywhere else. */
export function getToolbarStop(): ToolbarStop | undefined {
  return getContext<ToolbarStop | undefined>(TOOLBAR_STOP_KEY);
}

/**
 * What an overflow item lays over bits-ui's attributes: `data-disabled` while
 * it is in the menu, which takes it out of bits-ui's roving set (a hidden
 * control can't take focus, so an arrow key would stop there), and the
 * toolbar's own `tabindex`. Empty outside an overflowing toolbar.
 */
export function overflowControl(
  stop: ToolbarStop | undefined,
  attributes: Readonly<Record<string, unknown>>,
  props: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const id = attributes['data-overflow-id'];
  if (stop === undefined || typeof id !== 'string') return {};
  return {
    'data-disabled': attributes['data-overflow-hidden'] === undefined ? props['data-disabled'] : '',
    tabindex: stop.tabIndex(id),
  };
}
