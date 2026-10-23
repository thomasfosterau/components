/**
 * The bits-ui pieces a `DropdownMenu` lends to the `MenuItem`s and
 * `MenuSeparator`s inside it.
 *
 * `MenuItem` and `MenuSeparator` are written once for both kinds of menu, but
 * only a dropdown needs bits-ui's `DropdownMenu.Item` / `.Separator` — and a
 * static import of them would put the whole dropdown runtime (about 30 KB
 * gzip) on every page that renders a plain navigation list (#129). So the
 * dropdown parts travel down as context, set by `DropdownMenu`, which is the
 * one module that imports `bits-ui`'s `DropdownMenu`. A `MenuItem` outside a
 * `DropdownMenu` never sees them and never loads them.
 *
 * Internal: not re-exported from the `ui` barrel.
 *
 * @module
 */

import { getContext, setContext, type Component, type Snippet } from 'svelte';

/** What `MenuItem` hands the dropdown item part. */
export interface DropdownItemPartProps {
  /** The resolved link target; `undefined` renders a button. */
  href: string | undefined;
  /** Whether the item is the current page. */
  current: boolean;
  /** Shown but not activatable. */
  disabled: boolean;
  /** Called when the item is chosen. */
  onSelect: () => void;
  /** Extra classes on the `<li>`. */
  class: string | undefined;
  /** The item's label, icon included. */
  label: Snippet<[]>;
}

/** What `MenuSeparator` hands the dropdown separator part. */
export interface DropdownSeparatorPartProps {
  /** Extra classes on the separator. */
  class: string | undefined;
}

/** The two components a `DropdownMenu` lends its descendants. */
export interface DropdownParts {
  readonly item: Component<DropdownItemPartProps>;
  readonly separator: Component<DropdownSeparatorPartProps>;
}

const DROPDOWN_PARTS_KEY = Symbol('@thomasfosterau/components:dropdown-parts');

/** Lend the dropdown parts to every descendant. Called by `DropdownMenu`. */
export function setDropdownParts(parts: DropdownParts): void {
  setContext<DropdownParts>(DROPDOWN_PARTS_KEY, parts);
}

/** The enclosing `DropdownMenu`'s parts, or `undefined` outside one. */
export function getDropdownParts(): DropdownParts | undefined {
  return getContext<DropdownParts | undefined>(DROPDOWN_PARTS_KEY);
}
