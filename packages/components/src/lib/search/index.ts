/**
 * search — the command palette.
 *
 * One component, because a palette is one thing: a dialog, a query box, and
 * rows from wherever the app has them. It composes `feedback/Dialog` and
 * bits-ui's `Command`, lists the hotkey registry's palette actions when a
 * registry is mounted, and works from `items` / `onSearch` alone when none
 * is.
 *
 * @module
 */

export { default as CommandPalette } from './CommandPalette.svelte';
export { defaultCommandGroups, type CommandGroup, type CommandItem } from './types.ts';
