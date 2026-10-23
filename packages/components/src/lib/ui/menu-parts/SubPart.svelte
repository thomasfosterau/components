<!-- @component
Internal: the bits-ui submenu a `MenuSub` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  bits-ui's shared `Sub`: the `SubTrigger` is a `role="menuitem"` with
  `aria-haspopup="menu"` that opens on → (← closes and returns to it), and
  the `SubContent` is a `role="menu"` styled exactly as the parent menu's
  list, with the same `role="none"` presentation layer. The chevron is
  `aria-hidden`. Lent through `menu-parts.ts`.
-->
<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import { DropdownMenu } from 'bits-ui';
  import type { SubPartProps } from './menu-parts.ts';

  let { label, disabled, class: className, children }: SubPartProps = $props();
</script>

<li role="none" class={className}>
  <DropdownMenu.Sub>
    <DropdownMenu.SubTrigger {disabled} class="flex justify-between">
      <span>{label}</span>
      <ChevronRight class="size-4" aria-hidden="true" />
    </DropdownMenu.SubTrigger>
    <DropdownMenu.SubContent class="z-50" sideOffset={4}>
      <ul role="none" class="menu bg-base-100 rounded-box w-56 p-2 shadow-md">
        {@render children()}
      </ul>
    </DropdownMenu.SubContent>
  </DropdownMenu.Sub>
</li>
