<!-- @component
Internal: the bits-ui radio item a `MenuRadioItem` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  bits-ui's shared `RadioItem`: `role="menuitemradio"` with `aria-checked`,
  exclusive within its `MenuRadioGroup`. The dot is drawn from bits-ui's own
  `checked` and is `aria-hidden`. Lent through `menu-parts.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { RadioItemPartProps } from './menu-parts.ts';

  let { value, disabled, class: className, label }: RadioItemPartProps = $props();
</script>

<li role="none" class={className}>
  <DropdownMenu.RadioItem {value} {disabled}>
    {#snippet children({ checked })}
      <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
        {#if checked}<span class="bg-base-content size-2 rounded-full"></span>{/if}
      </span>
      {@render label()}
    {/snippet}
  </DropdownMenu.RadioItem>
</li>
