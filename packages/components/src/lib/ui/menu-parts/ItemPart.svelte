<!-- @component
Internal: the bits-ui item a `MenuItem` renders inside a `DropdownMenu` or `ContextMenu`.
-->
<!--
  Rendered through `bits-ui`'s `DropdownMenu.Item` `child` snippet, so the
  element is still the caller's own `<a>` or `<button>` — carrying bits-ui's
  `role="menuitem"`, its focus management and its selection handling. The
  `<li>` is `role="none"` so it does not sit between `role="menu"` and
  `role="menuitem"`. Lent to `MenuItem` through `menu-parts.ts`.
  `DropdownMenu.Item` is bits-ui's shared `bits/menu` item, the same
  component as `ContextMenu.Item`, so this part serves both menus.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { ItemPartProps } from './menu-parts.ts';

  let { href, current, disabled, onSelect, class: className, label }: ItemPartProps =
    $props();
</script>

<li role="none" class={className}>
  <DropdownMenu.Item {disabled} {onSelect}>
    {#snippet child({ props })}
      {#if href === undefined}
        <button {...props} type="button">{@render label()}</button>
      {:else}
        <a {...props} {href} aria-current={current ? 'page' : undefined}>
          {@render label()}
        </a>
      {/if}
    {/snippet}
  </DropdownMenu.Item>
</li>
