<!-- @component
Site navigation where some top-level entries open a panel of further links (a mega-menu), on bits-ui's `NavigationMenu`; a `Disclosure` per section when vertical.
-->
<!--
  NavigationMenu — the APG disclosure navigation pattern, not the menubar
  one: links stay links, in `<ul>`/`<li>`, with no `role="menu"` anywhere,
  so a screen reader announces destinations rather than actions and Tab
  walks every one. Render it in `Navbar`'s `center` (horizontal) and `menu`
  (vertical) snippets from the same `sections`.

  ARIA contract: a section with links is a `<button aria-expanded
  aria-controls>` (bits-ui); click, Enter or Space toggles it, hover also
  opens it unless `openOnHover` is false, and Escape closes it and returns
  focus to the trigger. Its panel renders right after the trigger, so Tab
  goes trigger, panel links, next trigger, and a closed panel's links are
  not in the order. The current page's link is `aria-current="page"`, and
  the trigger of the section holding it `aria-current="true"` so a reader
  knows where they are; vertically, the section holding it starts open.
  With `label` it is its own named `<nav>`; without,
  a plain `<div>` for a `Navbar` that already provides the landmark.

  Vertical, it is a `Disclosure` per section and loads nothing from bits-ui
  at render. It imports bits-ui's navigation-menu runtime either way, so it
  belongs on an app's root layout only by choice.
-->
<script lang="ts">
  import { NavigationMenu } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import NavigationMenuItem from './NavigationMenuItem.svelte';
  import NavigationStackSection from './NavigationStackSection.svelte';
  import type { NavigationSection } from './types.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The top-level entries. */
    sections: readonly NavigationSection[];
    /** Name a `<nav>` of its own; omit inside `Navbar`, which already names one. */
    label?: string | undefined;
    /**
     * A row with panels, or a stack of disclosures for a narrow screen.
     * @defaultValue `'horizontal'`
     */
    orientation?: 'horizontal' | 'vertical' | undefined;
    /**
     * Open a panel on pointer hover as well as on click.
     * @defaultValue `true`
     */
    openOnHover?: boolean | undefined;
    /**
     * Hover delay before a panel opens, in milliseconds.
     * @defaultValue `200`
     */
    delayDuration?: number | undefined;
    /** The open section's label; `''` when none. Bindable. */
    value?: string | undefined;
    /** A section's panel body in place of its link list (a featured card and links). */
    panel?: Snippet<[NavigationSection]> | undefined;
  }

  let {
    sections,
    label,
    orientation = 'horizontal',
    openOnHover = true,
    delayDuration = 200,
    value = $bindable(''),
    panel,
    class: className,
    ...rest
  }: Props = $props();
</script>

{#snippet stack()}
  <ul class="flex flex-col gap-2">
    {#each sections as section (section.label)}
      <li><NavigationStackSection {section} {panel} /></li>
    {/each}
  </ul>
{/snippet}

{#snippet row()}
  <NavigationMenu.List class="flex items-center gap-1">
    {#each sections as section (section.label)}
      <NavigationMenuItem {section} {openOnHover} {panel} />
    {/each}
  </NavigationMenu.List>
{/snippet}

{#if orientation === 'vertical'}
  {#if label === undefined}
    <div {...rest} class={className}>{@render stack()}</div>
  {:else}
    <nav {...rest} aria-label={label} class={className}>{@render stack()}</nav>
  {/if}
{:else}
  <NavigationMenu.Root bind:value {delayDuration}>
    {#snippet child({ props })}
      {#if label === undefined}
        <div {...props} {...rest} class={className}>{@render row()}</div>
      {:else}
        <nav {...props} {...rest} aria-label={label} class={className}>{@render row()}</nav>
      {/if}
    {/snippet}
  </NavigationMenu.Root>
{/if}
