<!-- @component
One entry of a `Menu` (a navigation link), or of a `DropdownMenu` or `ContextMenu` (a bits-ui menu item).
-->
<!--
  MenuItem — one entry of a `Menu`, `DropdownMenu` or `ContextMenu`; which
  one is decided by the enclosing menu, never by a prop.

  In `nav` mode it is a plain `<li><a>`: the current page takes daisyUI's
  `menu-active` AND `aria-current="page"`, because the highlight is a
  colour and the attribute is what says so out loud. `current` overrides the
  context's `isCurrent(href)`, which is what an app without a router-aware
  context uses.

  Inside a `DropdownMenu` or `ContextMenu` it renders the item part that menu lends it
  (`menu-parts/ItemPart.svelte`, through context), which goes through
  bits-ui's `DropdownMenu.Item` `child` snippet, so the element is still the
  caller's own `<a>` or `<button>` — carrying bits-ui's `role="menuitem"`, its
  focus management and its selection handling — rather than a `<div>`
  pretending to be one. This file imports nothing from bits-ui, so a
  navigation-only page never loads the dropdown runtime (#129). An item with
  an `href` is a link and must stay a link (middle-click, "open in new tab");
  an item without one is a button.

  ARIA contract: inside a `DropdownMenu` the `<li>` wrapper is `role="none"`
  so it does not sit between `role="menu"` and `role="menuitem"`, and
  `disabled` is bits-ui's (skipped by arrow keys, not activatable). In a
  navigation list `disabled` is `aria-disabled` + no `href`, where there is
  no widget to skip.
  The `icon` snippet is decorative — the label carries the meaning.

  `hotkey` shows the item's shortcut as a trailing `HotkeyBadge`, hidden from
  assistive technology so it does not join the item's name, and announces it
  through `aria-keyshortcuts` instead (a chord or a single key; a sequence
  has no `aria-keyshortcuts` form, so it is shown only). `tone="error"` marks
  a destructive item in `text-error`; the colour is supplementary, so the
  item's own verb ("Delete…") must still say what it does.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import HotkeyBadge from '../hotkeys/HotkeyBadge.svelte';
  import { ariaKeyShortcuts } from '../hotkeys/match.ts';
  import type { HotkeyTrigger } from '../hotkeys/types.ts';
  import { getMenuParts } from './menu-parts/menu-parts.ts';

  interface Props {
    /** Where the item navigates. Omitted, the item is a button. */
    href?: string | undefined;
    /** Called when the item is chosen. */
    onSelect?: (() => void) | undefined;
    /** Whether this item is the current page; defaults to the context's answer. */
    current?: boolean | undefined;
    /** Shown but not activatable. */
    disabled?: boolean | undefined;
    /** Leading icon. Decorative. */
    icon?: Snippet<[]> | undefined;
    /** The item's keyboard shortcut, shown as a hint and set as `aria-keyshortcuts`. */
    hotkey?: HotkeyTrigger | undefined;
    /** `'error'` for a destructive item; never the only cue. */
    tone?: 'error' | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    /** The item's label. */
    children: Snippet<[]>;
  }

  let {
    href,
    onSelect,
    current,
    disabled = false,
    icon,
    hotkey,
    tone,
    class: className,
    children,
  }: Props = $props();

  const context = getComponentsContext();
  const parts = getMenuParts();

  const resolved = $derived(href === undefined ? undefined : context.href(href));
  // bits-ui's `onSelect` is not optional-friendly under
  // `exactOptionalPropertyTypes`; a stable wrapper is simpler than a spread.
  const select = (): void => onSelect?.();
  const keyshortcuts = $derived(hotkey === undefined ? undefined : ariaKeyShortcuts(hotkey));
  const itemClass = $derived(tone === 'error' ? 'text-error' : undefined);
  const isCurrent = $derived(
    current ?? (resolved === undefined ? false : context.isCurrent(resolved)),
  );
</script>

{#snippet label()}
  {#if icon}<span class="size-5 shrink-0" aria-hidden="true">{@render icon()}</span>{/if}
  {@render children()}
  {#if hotkey !== undefined}
    <span aria-hidden="true" class="text-base-content/60 ms-auto text-xs">
      <HotkeyBadge trigger={hotkey} />
    </span>
  {/if}
{/snippet}

{#if parts}
  <parts.item
    href={resolved}
    current={isCurrent}
    {disabled}
    onSelect={select}
    class={className}
    {itemClass}
    {keyshortcuts}
    {label}
  />
{:else}
  <li class={className}>
    {#if resolved === undefined}
      <button
        type="button"
        {disabled}
        class={itemClass}
        aria-keyshortcuts={keyshortcuts}
        onclick={select}
      >
        {@render label()}
      </button>
    {:else}
      <a
        href={disabled ? undefined : resolved}
        aria-disabled={disabled ? 'true' : undefined}
        aria-current={isCurrent ? 'page' : undefined}
        class={[itemClass, isCurrent && 'menu-active']}
        aria-keyshortcuts={keyshortcuts}
        onclick={select}
      >
        {@render label()}
      </a>
    {/if}
  </li>
{/if}
