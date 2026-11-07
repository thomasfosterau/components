<!-- @component
Internal: the bits-ui group a `MenuGroup` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  A `role="group"` named by its heading (bits-ui's `GroupHeading`, which it
  wires with `aria-labelledby`), or by `aria-label` when the heading is not
  shown. The `<li>` is `role="none"`, like every part's. Lent to `MenuGroup`
  through `menu-parts.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { GroupPartProps } from './menu-parts.ts';

  let { label, showLabel, class: className, children }: GroupPartProps = $props();
</script>

<li role="none" class={className}>
  <DropdownMenu.Group aria-label={showLabel ? undefined : label}>
    {#if showLabel}
      <DropdownMenu.GroupHeading class="menu-title px-2">{label}</DropdownMenu.GroupHeading>
    {/if}
    <ul role="none" class="ms-0 ps-0 before:hidden">
      {@render children()}
    </ul>
  </DropdownMenu.Group>
</li>
