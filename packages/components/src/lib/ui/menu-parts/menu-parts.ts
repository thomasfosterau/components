/**
 * The bits-ui pieces a `DropdownMenu` or `ContextMenu` lends to the
 * `MenuItem`, `MenuSeparator`, `MenuCheckboxItem`, `MenuRadioGroup`,
 * `MenuRadioItem` and `MenuSub` inside it.
 *
 * Those children are written once for every kind of menu, but only the
 * bits-ui menus need bits-ui's `Item` / `Separator` / `CheckboxItem` / … — and
 * a static import of them would put the menu runtime (about 30 KB gzip) on
 * every page that renders a plain navigation list (#129). So the parts travel
 * down as context, set by `DropdownMenu` and `ContextMenu`, the only modules
 * that import them. A child outside such a menu never sees them and never
 * loads them.
 *
 * bits-ui's dropdown and context menus share these components (both re-export
 * `bits/menu`'s `Item`, `Separator`, `CheckboxItem`, `RadioGroup`,
 * `RadioItem` and `Sub*`), so one set of parts serves both (#157).
 *
 * Internal: not re-exported from the `ui` barrel.
 *
 * @module
 */

import { getContext, setContext, type Component, type Snippet } from 'svelte';

/** What `MenuItem` hands the item part. */
export interface ItemPartProps {
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

/** What `MenuSeparator` hands the separator part. */
export interface SeparatorPartProps {
  /** Extra classes on the separator. */
  class: string | undefined;
}

/** What `MenuCheckboxItem` hands the checkbox item part. */
export interface CheckboxItemPartProps {
  /** Whether the item is checked. */
  checked: boolean;
  /** Called with the next state when the reader toggles it. */
  onCheckedChange: (checked: boolean) => void;
  /** Shown but not activatable. */
  disabled: boolean;
  /** Extra classes on the `<li>`. */
  class: string | undefined;
  /** The item's label. */
  label: Snippet<[]>;
}

/** What `MenuRadioGroup` hands the radio group part. */
export interface RadioGroupPartProps {
  /** The chosen value. */
  value: string;
  /** Called with the chosen value. */
  onValueChange: (value: string) => void;
  /** Visible heading; also the group's accessible name. */
  label: string | undefined;
  /** Extra classes on the `<li>`. */
  class: string | undefined;
  /** The `MenuRadioItem`s. */
  children: Snippet<[]>;
}

/** What `MenuRadioItem` hands the radio item part. */
export interface RadioItemPartProps {
  /** The value this item chooses. */
  value: string;
  /** Shown but not activatable. */
  disabled: boolean;
  /** Extra classes on the `<li>`. */
  class: string | undefined;
  /** The item's label. */
  label: Snippet<[]>;
}

/** What `MenuSub` hands the submenu part. */
export interface SubPartProps {
  /** Text of the item that opens the submenu. */
  label: string;
  /** Shown but not activatable. */
  disabled: boolean;
  /** Extra classes on the `<li>`. */
  class: string | undefined;
  /** The submenu's items. */
  children: Snippet<[]>;
}

/** The components a bits-ui menu lends its descendants, and which kind of menu it is. */
export interface MenuParts {
  readonly kind: 'dropdown' | 'context';
  readonly item: Component<ItemPartProps>;
  readonly separator: Component<SeparatorPartProps>;
  readonly checkboxItem: Component<CheckboxItemPartProps>;
  readonly radioGroup: Component<RadioGroupPartProps>;
  readonly radioItem: Component<RadioItemPartProps>;
  readonly sub: Component<SubPartProps>;
}

const MENU_PARTS_KEY = Symbol('@thomasfosterau/components:menu-parts');

/** Lend the menu parts to every descendant. Called by `DropdownMenu` and `ContextMenu`. */
export function setMenuParts(parts: MenuParts): void {
  setContext<MenuParts>(MENU_PARTS_KEY, parts);
}

/** The enclosing bits-ui menu's parts, or `undefined` outside one. */
export function getMenuParts(): MenuParts | undefined {
  return getContext<MenuParts | undefined>(MENU_PARTS_KEY);
}
