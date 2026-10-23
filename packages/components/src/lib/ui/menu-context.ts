/**
 * How a {@link MenuItem} learns which kind of menu it is inside.
 *
 * A `MenuItem` renders entirely different markup in a `DropdownMenu` or a
 * `ContextMenu` — a bits-ui menu item with roving focus and typeahead — and
 * in a `Menu` or a hand-assembled list, where it is a plain anchor in a
 * `<ul class="menu">` navigation list. A call site writes the same
 * `<MenuItem>` either way. The mode is never a prop: it is which menu
 * encloses the item, so a caller can never get the two out of step.
 *
 * `DropdownMenu` and `ContextMenu` are the only components that import
 * bits-ui's menus, and they lend the item parts to their descendants through
 * context, so a navigation-only `Menu` never loads the menu runtime (#129).
 *
 * @module
 */

import { getMenuParts } from './menu-parts/menu-parts.ts';

/** Which kind of menu an item is inside: a dropdown, a context menu or a navigation list. */
export type MenuMode = 'dropdown' | 'context' | 'nav';

/** The enclosing menu's mode: `dropdown` or `context` inside a bits-ui menu, otherwise `nav`. */
export function getMenuMode(): () => MenuMode {
  const mode: MenuMode = getMenuParts()?.kind ?? 'nav';
  return () => mode;
}
