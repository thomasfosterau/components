<!--
  Menu — one component over the two things daisyUI calls a `menu`, because a
  call site writes the same `<MenuItem>` list for both.

  `mode="nav"` is site navigation: a `<nav>` landmark around a `<ul
  class="menu">` of links, where the current page marks itself with
  `aria-current="page"`. Links, list, landmark — no widget, no roving focus,
  no Escape. Everything stays reachable with nothing but Tab, which is the
  correct behaviour for navigation and the wrong behaviour for a menu.

  `mode="dropdown"` is an application menu: bits-ui's `DropdownMenu`, which
  owns `aria-haspopup`/`aria-expanded` on the trigger, arrow-key roving
  focus, typeahead, Escape to close and focus return. The daisyUI `menu`
  styling is applied to a `<ul>` INSIDE the content; that list and its items'
  `<li>` wrappers carry `role="none"` so the presentation layer does not come
  between `role="menu"` and its `role="menuitem"` children in the
  accessibility tree.

  The mode reaches `MenuItem` through context rather than a prop, so the two
  can never be set inconsistently. See `menu-context.ts`.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { setMenuMode } from './menu-context.ts';

  interface Props {
    mode?: 'dropdown' | 'nav' | undefined;
    /** Accessible name of the navigation landmark / the open menu. */
    label: string;
    /** Whether the dropdown is open. Bindable; ignored in `nav` mode. */
    open?: boolean | undefined;
    side?: 'top' | 'right' | 'bottom' | 'left' | undefined;
    align?: 'start' | 'center' | 'end' | undefined;
    /** Extra classes on the `<ul class="menu">`. */
    class?: string | undefined;
    /** The dropdown's trigger — the caller's own element, spreading `props`. */
    trigger?: Snippet<[{ props: Record<string, unknown> }]> | undefined;
    children: Snippet<[]>;
  }

  let {
    mode = 'nav',
    label,
    open = $bindable(false),
    side = 'bottom',
    align = 'end',
    class: className,
    trigger,
    children,
  }: Props = $props();

  setMenuMode(() => mode);
</script>

{#if mode === 'dropdown'}
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
{:else}
  <nav aria-label={label}>
    <ul class={['menu w-full gap-1 p-0', className]}>
      {@render children()}
    </ul>
  </nav>
{/if}
