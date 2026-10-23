/**
 * The one set of bits-ui menu parts, for `DropdownMenu` and `ContextMenu` to
 * lend their children. Importing this module is what reaches bits-ui's menu
 * runtime, so only those two components import it.
 *
 * Internal: not re-exported from the `ui` barrel.
 *
 * @module
 */

import CheckboxItemPart from './CheckboxItemPart.svelte';
import ItemPart from './ItemPart.svelte';
import type { MenuParts } from './menu-parts.ts';
import RadioGroupPart from './RadioGroupPart.svelte';
import RadioItemPart from './RadioItemPart.svelte';
import SeparatorPart from './SeparatorPart.svelte';
import SubPart from './SubPart.svelte';

/** The parts for a menu of the given kind. */
export function menuParts(kind: MenuParts['kind']): MenuParts {
  return {
    kind,
    item: ItemPart,
    separator: SeparatorPart,
    checkboxItem: CheckboxItemPart,
    radioGroup: RadioGroupPart,
    radioItem: RadioItemPart,
    sub: SubPart,
  };
}
