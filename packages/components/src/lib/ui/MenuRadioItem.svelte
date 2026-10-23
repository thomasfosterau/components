<!-- @component
One option of a `MenuRadioGroup` (`role="menuitemradio"`).
-->
<!--
  MenuRadioItem — one option of a `MenuRadioGroup`. It renders the radio
  item part its enclosing `DropdownMenu` or `ContextMenu` lends it through
  context (`menu-parts/RadioItemPart.svelte`), so this file imports nothing
  from bits-ui (#129).

  ARIA contract: `role="menuitemradio"` with `aria-checked`; the dot is
  `aria-hidden`. Outside a `DropdownMenu` / `ContextMenu` it renders nothing.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** The value this item chooses in its `MenuRadioGroup`. */
    value: string;
    /** Shown but not activatable. */
    disabled?: boolean | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The item's label. */
    children: Snippet<[]>;
  }

  let { value, disabled = false, class: className, children }: Props = $props();

  const parts = getMenuParts();
</script>

{#if parts}
  <parts.radioItem {value} {disabled} class={className} label={children} />
{/if}
