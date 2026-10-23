<!-- @component
Internal: the bits-ui radio group a `MenuRadioGroup` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  bits-ui's shared `RadioGroup` (`role="group"`), headed by its
  `GroupHeading` when there is a `label`, which also names the group. The
  `MenuRadioItem`s sit in a nested `<ul role="none">` so the markup stays a
  valid list; daisyUI's nested-menu indent and rule are reset, since this is
  a group, not a submenu. Lent through `menu-parts.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { RadioGroupPartProps } from './menu-parts.ts';

  let { value, onValueChange, label, class: className, children }: RadioGroupPartProps =
    $props();
</script>

<li role="none" class={className}>
  <DropdownMenu.RadioGroup {value} {onValueChange}>
    {#if label !== undefined}
      <DropdownMenu.GroupHeading class="menu-title px-2">{label}</DropdownMenu.GroupHeading>
    {/if}
    <ul role="none" class="ms-0 ps-0 before:hidden">
      {@render children()}
    </ul>
  </DropdownMenu.RadioGroup>
</li>
