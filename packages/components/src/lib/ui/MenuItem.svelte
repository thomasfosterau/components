<!-- @component
One entry of a `Menu` (a navigation link), or of a `DropdownMenu` or `ContextMenu` (a bits-ui menu item).
-->
<!--
  MenuItem — one entry of a `Menu`, `DropdownMenu` or `ContextMenu`; which
  one is decided by the enclosing menu, never by a prop.

  In `nav` mode it is a plain `<li><a>`: the current page takes daisyUI's
  `menu-active` AND `aria-current="page"`, because the highlight is a
  colour and the attribute is what says so out loud. `current` overrides the
  context's `isCurrent(href)`, which is what an app without a router-aware
  context uses.

  Inside a `DropdownMenu` or `ContextMenu` it renders the item part that menu lends it
  (`menu-parts/ItemPart.svelte`, through context), which goes through
  bits-ui's `DropdownMenu.Item` `child` snippet, so the element is still the
  caller's own `<a>` or `<button>` — carrying bits-ui's `role="menuitem"`, its
  focus management and its selection handling — rather than a `<div>`
  pretending to be one. This file imports nothing from bits-ui, so a
  navigation-only page never loads the dropdown runtime (#129). An item with
  an `href` is a link and must stay a link (middle-click, "open in new tab");
  an item without one is a button.

  ARIA contract: inside a `DropdownMenu` the `<li>` wrapper is `role="none"`
  so it does not sit between `role="menu"` and `role="menuitem"`, and
  `disabled` is bits-ui's (skipped by arrow keys, not activatable). In a
  navigation list `disabled` is `aria-disabled` + no `href`, where there is
  no widget to skip.
  The `icon` snippet is decorative — the label carries the meaning.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** Where the item navigates. Omitted, the item is a button. */
    href?: string | undefined;
    /** Called when the item is chosen. */
    onSelect?: (() => void) | undefined;
    /** Whether this item is the current page; defaults to the context's answer. */
    current?: boolean | undefined;
    /** Shown but not activatable. */
    disabled?: boolean | undefined;
    /** Leading icon. Decorative. */
    icon?: Snippet<[]> | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The item's label. */
    children: Snippet<[]>;
  }

  let { href, onSelect, current, disabled = false, icon, class: className, children }: Props =
    $props();

  const context = getComponentsContext();
  const parts = getMenuParts();

  const resolved = $derived(href === undefined ? undefined : context.href(href));
  // bits-ui's `onSelect` is not optional-friendly under
  // `exactOptionalPropertyTypes`; a stable wrapper is simpler than a spread.
  const select = (): void => onSelect?.();
  const isCurrent = $derived(
    current ?? (resolved === undefined ? false : context.isCurrent(resolved)),
  );
</script>

{#snippet label()}
  {#if icon}<span class="size-5 shrink-0" aria-hidden="true">{@render icon()}</span>{/if}
  {@render children()}
{/snippet}

{#if parts}
  <parts.item
    href={resolved}
    current={isCurrent}
    {disabled}
    onSelect={select}
    class={className}
    {label}
  />
{:else}
  <li class={className}>
    {#if resolved === undefined}
      <button type="button" {disabled} onclick={select}>{@render label()}</button>
    {:else}
      <a
        href={disabled ? undefined : resolved}
        aria-disabled={disabled ? 'true' : undefined}
        aria-current={isCurrent ? 'page' : undefined}
        class:menu-active={isCurrent}
        onclick={select}
      >
        {@render label()}
      </a>
    {/if}
  </li>
{/if}
