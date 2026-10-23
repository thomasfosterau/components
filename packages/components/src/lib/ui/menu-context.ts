/**
 * How a {@link MenuItem} learns which kind of menu it is inside.
 *
 * A `MenuItem` renders entirely different markup in a `DropdownMenu` — a
 * bits-ui `DropdownMenu.Item` with roving focus and typeahead — and in a
 * `Menu` or a hand-assembled list, where it is a plain anchor in a
 * `<ul class="menu">` navigation list. A call site writes the same
 * `<MenuItem>` either way. The mode is never a prop: it is whether a
 * `DropdownMenu` encloses the item, so a caller can never get the two out of
 * step.
 *
 * `DropdownMenu` is the one component that imports bits-ui's dropdown, and it
 * lends the item and separator parts to its descendants through context, so a
 * navigation-only `Menu` never loads the dropdown runtime (#129).
 *
 * @module
 */

import { getDropdownParts } from './dropdown/dropdown-parts.ts';

/** Which of the two things daisyUI calls a `menu` an item is inside: a dropdown or a navigation list. */
export type MenuMode = 'dropdown' | 'nav';

/** The enclosing menu's mode: `dropdown` inside a `DropdownMenu`, otherwise `nav`. */
export function getMenuMode(): () => MenuMode {
  const mode: MenuMode = getDropdownParts() === undefined ? 'nav' : 'dropdown';
  return () => mode;
}
