/**
 * How a {@link MenuItem} learns which {@link Menu} it is inside.
 *
 * The two menu modes render entirely different markup — a bits-ui
 * `DropdownMenu.Item` with roving focus and typeahead, or a plain anchor in a
 * `<ul class="menu">` navigation list — but a call site writes the same
 * `<MenuItem>` either way. The mode travels down as context rather than as a
 * prop so a caller can never get the two out of step, and so `Menu` stays the
 * single place the choice is made.
 *
 * A `MenuItem` mounted with no `Menu` above it (a list of links assembled by
 * hand) falls back to `nav`, which is the mode that needs nothing from its
 * parent.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

export type MenuMode = 'dropdown' | 'nav';

const MENU_MODE_KEY = Symbol('@thomasfosterau/components:menu-mode');

/** Declare the mode every descendant `MenuItem` renders in. Called by `Menu`. */
export function setMenuMode(mode: () => MenuMode): void {
  setContext<() => MenuMode>(MENU_MODE_KEY, mode);
}

/** The enclosing `Menu`'s mode, or `nav` when there is no enclosing `Menu`. */
export function getMenuMode(): () => MenuMode {
  return getContext<(() => MenuMode) | undefined>(MENU_MODE_KEY) ?? (() => 'nav');
}
