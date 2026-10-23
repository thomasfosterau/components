<!-- @component
Internal: the bits-ui item a `MenuItem` renders inside a `DropdownMenu`.
-->
<!--
  Rendered through `bits-ui`'s `DropdownMenu.Item` `child` snippet, so the
  element is still the caller's own `<a>` or `<button>` — carrying bits-ui's
  `role="menuitem"`, its focus management and its selection handling. The
  `<li>` is `role="none"` so it does not sit between `role="menu"` and
  `role="menuitem"`. Lent to `MenuItem` through `dropdown-parts.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { DropdownItemPartProps } from './dropdown-parts.ts';

  let { href, current, disabled, onSelect, class: className, label }: DropdownItemPartProps =
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
