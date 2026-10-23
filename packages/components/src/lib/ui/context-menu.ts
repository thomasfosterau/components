/**
 * `@thomasfosterau/components/context-menu` — the right-click / long-press
 * menu, kept out of the root barrel so bits-ui's menu runtime loads only on
 * the pages that use it.
 *
 * Its children (`MenuItem`, `MenuSeparator`, `MenuCheckboxItem`,
 * `MenuRadioGroup`, `MenuRadioItem`, `MenuSub`) come from the root barrel,
 * which carries no bits-ui menu code: `ContextMenu` lends them its parts
 * through context.
 *
 * @module
 */

export { default as ContextMenu } from './ContextMenu.svelte';
