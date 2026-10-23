<!-- @component
A menu that opens at the pointer on a right-click (or long-press) of a region, on bits-ui's `ContextMenu`.
-->
<!--
  ContextMenu — the actions for one thing (a row in a list, a node on a
  canvas, an image), opened where the reader right-clicks it, long-presses it
  on touch, or presses Shift+F10 / the Menu key while it has focus. Built on
  bits-ui's `ContextMenu`, which owns the menu at the pointer, roving focus,
  typeahead, → / ← for submenus, Escape and outside click to close, and focus
  return. Its children are the same `MenuItem`, `MenuSeparator`,
  `MenuCheckboxItem`, `MenuRadioGroup` / `MenuRadioItem` and `MenuSub` that a
  `DropdownMenu` takes; this component lends them the bits-ui parts through
  context (`menu-parts/`).

  Never the only route to an action. A context menu is invisible until it is
  summoned, and touch screen-reader users (and many keyboard users) never
  discover it. Put every action somewhere visible too: a row's "More"
  `DropdownMenu`, a toolbar.

  The region is the caller's own element: the `trigger` snippet receives
  `props` to spread onto it. Those props make it focusable (`tabindex="0"`,
  which a natively focusable element does not mind; pass a `tabindex` of your
  own after the spread to override it), because browsers fire `contextmenu`
  for the keyboard only on the focused element. Shift+F10 and the Menu key
  are handled here rather than left to the browser, so they open the menu at
  the region's corner the same way everywhere.

  ARIA contract: the content is `role="menu"` named by `label`; the daisyUI
  `menu` `<ul>` and its `<li>`s are `role="none"`, exactly as in
  `DropdownMenu`, so `role="menu"` owns its items. `disabled` lets the
  browser's own context menu show instead.

  Not part of the root barrel: it is its own entry,
  `@thomasfosterau/components/context-menu`, so the menu runtime loads only on
  the pages that use it.
-->
<script lang="ts">
  import { ContextMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { menuParts } from './menu-parts/parts.ts';
  import { setMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** Accessible name of the open menu ("Actions for Rosa canina"). */
    label: string;
    /** Whether the menu is open. Bindable. */
    open?: boolean | undefined;
    /**
     * Turn the menu off; the browser's own context menu shows instead.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /** Extra classes on the `<ul class="menu">`. */
    class?: string | undefined;
    /** The region the menu belongs to — the caller's own element, spreading `props`. */
    trigger: Snippet<[{ props: Record<string, unknown> }]>;
    /** The menu's items. */
    children: Snippet<[]>;
  }

  let {
    label,
    open = $bindable(false),
    disabled = false,
    class: className,
    trigger,
    children,
  }: Props = $props();

  setMenuParts(menuParts('context'));

  // Shift+F10 and the Menu key: open at the region's bottom-left corner by
  // dispatching the `contextmenu` event bits-ui's trigger listens for.
  // `preventDefault` stops the browser from generating its own as well.
  const openFromKeyboard = (event: KeyboardEvent): void => {
    if (disabled) return;
    const isMenuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
    if (!isMenuKey) return;
    event.preventDefault();
    const region = event.currentTarget;
    if (!(region instanceof HTMLElement)) return;
    const rect = region.getBoundingClientRect();
    region.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left,
        clientY: rect.bottom,
      }),
    );
  };
</script>

<ContextMenu.Root bind:open>
  <ContextMenu.Trigger {disabled} tabindex={0} onkeydown={openFromKeyboard}>
    {#snippet child({ props })}
      {@render trigger({ props })}
    {/snippet}
  </ContextMenu.Trigger>
  <ContextMenu.Portal>
    <ContextMenu.Content aria-label={label} class="z-50">
      <ul role="none" class={['menu bg-base-100 rounded-box w-56 p-2 shadow-md', className]}>
        {@render children()}
      </ul>
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
