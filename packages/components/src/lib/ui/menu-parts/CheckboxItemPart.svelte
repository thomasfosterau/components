<!-- @component
Internal: the bits-ui checkbox item a `MenuCheckboxItem` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  bits-ui's shared `CheckboxItem` (`DropdownMenu.CheckboxItem` is
  `ContextMenu.CheckboxItem`): `role="menuitemcheckbox"` with `aria-checked`,
  toggled by Enter / Space or a click without closing the menu's focus
  management. The check mark is drawn from bits-ui's own `checked`, so the
  visual and the accessibility tree cannot disagree; it is `aria-hidden`
  because `aria-checked` already says it. Lent through `menu-parts.ts`.
-->
<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { DropdownMenu } from 'bits-ui';
  import type { CheckboxItemPartProps } from './menu-parts.ts';

  let { checked, onCheckedChange, disabled, class: className, label }: CheckboxItemPartProps =
    $props();
</script>

<li role="none" class={className}>
  <DropdownMenu.CheckboxItem {checked} {onCheckedChange} {disabled}>
    {#snippet children({ checked: on })}
      <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
        {#if on}<Check class="size-4" />{/if}
      </span>
      {@render label()}
    {/snippet}
  </DropdownMenu.CheckboxItem>
</li>
