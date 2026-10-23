<!-- @component
A submenu of a `DropdownMenu` or `ContextMenu`: an item that opens a further menu.
-->
<!--
  MenuSub — an item that opens a further menu ("Move to ▸"). It renders the
  submenu part its enclosing `DropdownMenu` or `ContextMenu` lends it through
  context (`menu-parts/SubPart.svelte`), so this file imports nothing from
  bits-ui (#129). The children are the same `MenuItem`s, separators and
  checkbox / radio items the parent menu takes.

  ARIA contract: the opener is a `role="menuitem"` with
  `aria-haspopup="menu"` and `aria-expanded`; → opens the submenu and focuses
  its first item, ← closes it and returns focus to the opener. Outside a
  `DropdownMenu` / `ContextMenu` it renders nothing: a navigation list has no
  submenus to open.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** Text of the item that opens the submenu. */
    label: string;
    /** Shown but not activatable. */
    disabled?: boolean | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The submenu's items. */
    children: Snippet<[]>;
  }

  let { label, disabled = false, class: className, children }: Props = $props();

  const parts = getMenuParts();
</script>

{#if parts}
  <parts.sub {label} {disabled} class={className} {children} />
{/if}
