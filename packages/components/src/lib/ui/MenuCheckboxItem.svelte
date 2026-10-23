<!-- @component
An on/off entry of a `DropdownMenu` or `ContextMenu` (`role="menuitemcheckbox"`).
-->
<!--
  MenuCheckboxItem — a setting toggled from a menu ("Show archived"). It
  renders the checkbox item part its enclosing `DropdownMenu` or
  `ContextMenu` lends it through context (`menu-parts/CheckboxItemPart.svelte`),
  so this file imports nothing from bits-ui and costs a navigation-only page
  nothing (#129).

  ARIA contract: `role="menuitemcheckbox"` with `aria-checked` from bits-ui;
  the check mark is `aria-hidden`. A checkbox item belongs to an application
  menu, not a navigation list, so outside a `DropdownMenu` / `ContextMenu` it
  renders nothing.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /**
     * Whether the item is checked. Bindable.
     * @defaultValue `false`
     */
    checked?: boolean | undefined;
    /** Called with the next state when the reader toggles it. */
    onCheckedChange?: ((checked: boolean) => void) | undefined;
    /** Shown but not activatable. */
    disabled?: boolean | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The item's label. */
    children: Snippet<[]>;
  }

  let {
    checked = $bindable(false),
    onCheckedChange,
    disabled = false,
    class: className,
    children,
  }: Props = $props();

  const parts = getMenuParts();
  const change = (next: boolean): void => {
    checked = next;
    onCheckedChange?.(next);
  };
</script>

{#if parts}
  <parts.checkboxItem
    {checked}
    onCheckedChange={change}
    {disabled}
    class={className}
    label={children}
  />
{/if}
