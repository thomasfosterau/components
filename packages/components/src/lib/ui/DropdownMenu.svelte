<!-- @component
An application menu behind a trigger — a bits-ui dropdown of `MenuItem`s styled as a daisyUI `menu`.
-->
<!--
  DropdownMenu — an application menu: bits-ui's `DropdownMenu`, which owns
  `aria-haspopup`/`aria-expanded` on the trigger, arrow-key roving focus,
  typeahead, Escape to close and focus return. The daisyUI `menu` styling is
  applied to a `<ul>` INSIDE the content; that list and its items' `<li>`
  wrappers carry `role="none"` so the presentation layer does not come
  between `role="menu"` and its `role="menuitem"` children in the
  accessibility tree.

  It is a separate component from `Menu` (site navigation) so that bits-ui's
  dropdown runtime is reached only by an app that actually renders a
  dropdown: `Menu`, `MenuItem`, `MenuSeparator` and `Sidebar` import nothing
  from bits-ui (#129). The children are the same `MenuItem` /
  `MenuSeparator` a `Menu` takes; this component lends them its bits-ui item
  and separator parts through context (`menu-parts/menu-parts.ts`), and
  the same for `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem` and
  `MenuSub`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { menuParts } from './menu-parts/parts.ts';
  import { setMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** Accessible name of the open menu. */
    label: string;
    /** Whether the menu is open. Bindable. */
    open?: boolean | undefined;
    /**
     * Which side of the trigger the menu opens on.
     * @defaultValue `'bottom'`
     */
    side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
    /**
     * Alignment against the trigger.
     * @defaultValue `'end'`
     */
    align?: 'start' | 'center' | 'end' | undefined;
    /** Extra classes on the `<ul class="menu">`. */
    class?: string | undefined;
    /** The trigger — the caller's own element, spreading `props`. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    /** The `MenuItem`s. */
    children: Snippet<[]>;
  }

  let {
    label,
    open = $bindable(false),
    side = 'bottom',
    align = 'end',
    class: className,
    trigger,
    children,
  }: Props = $props();

  setMenuParts(menuParts('dropdown'));
</script>

<DropdownMenu.Root bind:open>
  {#if trigger}
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        {@render trigger({ props })}
      {/snippet}
    </DropdownMenu.Trigger>
  {/if}
  <DropdownMenu.Portal>
    <DropdownMenu.Content {side} {align} sideOffset={8} aria-label={label} class="z-50">
      <ul role="none" class={['menu bg-base-100 rounded-box w-56 p-2 shadow-md', className]}>
        {@render children()}
      </ul>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
