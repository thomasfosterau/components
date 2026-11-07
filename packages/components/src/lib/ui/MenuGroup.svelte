<!-- @component
A labelled group of menu items: a `role="group"` in a `DropdownMenu` or `ContextMenu`, a titled sub-list in a navigation `Menu`.
-->
<!--
  MenuGroup — a non-interactive heading over a run of items ("Recent",
  "Share"). Inside a `DropdownMenu` or `ContextMenu` it renders the group
  part its menu lends it through context (`menu-parts/GroupPart.svelte`): a
  `role="group"` named by its heading, or by `aria-label` when
  `showLabel={false}`. This file imports nothing from bits-ui (#129).

  In a navigation `Menu` (or `Sidebar`) it is daisyUI's titled sub-list: an
  `<li>` holding the `menu-title` and a nested `<ul>` of the items, the list
  named by the title through `aria-labelledby` (or by `aria-label` when
  `showLabel={false}`). The title is deliberately not a heading: a sidebar's
  group names would otherwise interleave with the page's own outline.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** The group's name; its visible heading unless `showLabel` is false. */
    label: string;
    /**
     * Show `label` as a heading.
     * @defaultValue `true`
     */
    showLabel?: boolean | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The group's items. */
    children: Snippet<[]>;
  }

  let { label, showLabel = true, class: className, children }: Props = $props();

  const parts = getMenuParts();
  const titleId = $props.id();
</script>

{#if parts}
  <parts.group {label} {showLabel} class={className} {children} />
{:else}
  <li class={className}>
    {#if showLabel}<span id={titleId} class="menu-title">{label}</span>{/if}
    <ul
      aria-labelledby={showLabel ? titleId : undefined}
      aria-label={showLabel ? undefined : label}
    >
      {@render children()}
    </ul>
  </li>
{/if}
