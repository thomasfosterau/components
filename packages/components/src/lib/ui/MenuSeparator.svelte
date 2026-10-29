<!-- @component
A rule between groups of `MenuItem`s.
-->
<!--
  MenuSeparator — a rule between groups of `MenuItem`s.

  ARIA contract: a real `role="separator"`, which is what tells a screen
  reader the grouping exists at all; a bare styled `<li>` is a line sighted
  readers can see and nobody else can. Inside a `DropdownMenu` or `ContextMenu` it renders the
  separator part that menu lends it through context: bits-ui's own separator
  (which also marks it non-focusable for the menu's arrow-key navigation),
  wrapped in a `role="none"` `<li>` so the presentational list item stays out
  of the accessibility tree. This file imports nothing from bits-ui (#129).

  Outside a menu, use `Divider`: it is the free-standing rule, and this one
  must stay an `<li>` inside the menu's list.
-->
<script lang="ts">
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let { class: className }: Props = $props();

  const parts = getMenuParts();
</script>

{#if parts}
  <parts.separator class={className} />
{:else}
  <li role="separator" class={['divider my-1 h-px', className]}></li>
{/if}
