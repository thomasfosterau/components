<!-- @component
A set of mutually exclusive `MenuRadioItem`s in a `DropdownMenu` or `ContextMenu`.
-->
<!--
  MenuRadioGroup — one choice from a few, made in a menu ("Sort by: name,
  date, size"). It renders the radio group part its enclosing `DropdownMenu`
  or `ContextMenu` lends it through context (`menu-parts/RadioGroupPart.svelte`),
  so this file imports nothing from bits-ui (#129).

  ARIA contract: a `role="group"` named by its visible `label` heading, around
  `role="menuitemradio"` items, exactly one `aria-checked`. Outside a
  `DropdownMenu` / `ContextMenu` it renders nothing.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /**
     * The chosen item's value; empty string when none is chosen. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /** Called with the chosen value. */
    onValueChange?: ((value: string) => void) | undefined;
    /** Visible group heading; also its accessible name. */
    label?: string | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The `MenuRadioItem`s. */
    children: Snippet<[]>;
  }

  let {
    value = $bindable(''),
    onValueChange,
    label,
    class: className,
    children,
  }: Props = $props();

  const parts = getMenuParts();
  const change = (next: string): void => {
    value = next;
    onValueChange?.(next);
  };
</script>

{#if parts}
  <parts.radioGroup {value} onValueChange={change} {label} class={className} {children} />
{/if}
