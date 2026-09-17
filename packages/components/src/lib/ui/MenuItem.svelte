<!--
  MenuItem — one entry of a `Menu`, in whichever of the two modes the
  enclosing `Menu` declared.

  In `nav` mode it is a plain `<li><a>`: the current page takes daisyUI's
  `menu-active` AND `aria-current="page"`, because the highlight is a
  colour and the attribute is what says so out loud. `current` overrides the
  context's `isCurrent(href)`, which is what an app without a router-aware
  context uses.

  In `dropdown` mode it renders through bits-ui's `DropdownMenu.Item` `child`
  snippet, so the element is still the caller's own `<a>` or `<button>` —
  carrying bits-ui's `role="menuitem"`, its focus management and its
  selection handling — rather than a `<div>` pretending to be one. An item
  with an `href` is a link and must stay a link (middle-click, "open in new
  tab"); an item without one is a button.

  ARIA contract: the `<li>` wrapper is `role="none"` in dropdown mode so it
  does not sit between `role="menu"` and `role="menuitem"`. `disabled` is
  bits-ui's in dropdown mode (skipped by arrow keys, not activatable) and
  `aria-disabled` + no `href` in nav mode, where there is no widget to skip.
  The `icon` snippet is decorative — the label carries the meaning.
-->
<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import { getMenuMode } from './menu-context.ts';

  interface Props {
    /** Where the item navigates. Omitted, the item is a button. */
    href?: string | undefined;
    /** Called when the item is chosen. */
    onSelect?: (() => void) | undefined;
    /** Whether this item is the current page; defaults to the context's answer. */
    current?: boolean | undefined;
    disabled?: boolean | undefined;
    /** Leading icon. Decorative. */
    icon?: Snippet<[]> | undefined;
    /** Extra classes on the `<li>`. */
    class?: string | undefined;
    children: Snippet<[]>;
  }

  let { href, onSelect, current, disabled = false, icon, class: className, children }: Props =
    $props();

  const context = getComponentsContext();
  const mode = getMenuMode();

  const resolved = $derived(href === undefined ? undefined : context.href(href));
  // bits-ui's `onSelect` is not optional-friendly under
  // `exactOptionalPropertyTypes`; a stable wrapper is simpler than a spread.
  const select = (): void => onSelect?.();
  const isCurrent = $derived(
    current ?? (resolved === undefined ? false : context.isCurrent(resolved)),
  );
</script>

{#snippet label()}
  {#if icon}<span class="size-5 shrink-0" aria-hidden="true">{@render icon()}</span>{/if}
  {@render children()}
{/snippet}

{#if mode() === 'dropdown'}
  <li role="none" class={className}>
    <DropdownMenu.Item {disabled} onSelect={select}>
      {#snippet child({ props })}
        {#if resolved === undefined}
          <button {...props} type="button">{@render label()}</button>
        {:else}
          <a {...props} href={resolved} aria-current={isCurrent ? 'page' : undefined}>
            {@render label()}
          </a>
        {/if}
      {/snippet}
    </DropdownMenu.Item>
  </li>
{:else}
  <li class={className}>
    {#if resolved === undefined}
      <button type="button" {disabled} onclick={select}>{@render label()}</button>
    {:else}
      <a
        href={disabled ? undefined : resolved}
        aria-disabled={disabled ? 'true' : undefined}
        aria-current={isCurrent ? 'page' : undefined}
        class:menu-active={isCurrent}
        onclick={select}
      >
        {@render label()}
      </a>
    {/if}
  </li>
{/if}
