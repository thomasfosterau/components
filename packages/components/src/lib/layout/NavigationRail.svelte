<!-- @component
The medium-width primary navigation: a narrow column of icon-over-label destinations, with optional header and footer slots.
-->
<!--
  NavigationRail — Material's navigation rail, WinUI's `LeftCompact` pane:
  the app's top-level destinations in an ~80px column, for widths where a
  `Sidebar` wastes a third of the screen and a `BottomNav` looks like a
  phone. `header` takes a FAB, a menu button or the brand mark; `footer`
  the account block. `AppShell`'s adaptive mode shows it between its
  `medium` and `expanded` breakpoints, from the same `NavDestination`s it
  turns into the bottom bar and the sidebar.

  No bits-ui for the list itself: the contract is a landmark, links and
  `aria-current`, which needs no primitive. A navigation list is not a
  composite widget, so there is no roving tabindex: Tab walks the links in
  DOM order. With `labels="current"` the non-current labels are
  `VisuallyHidden` (still each link's name) and the existing `Tooltip`
  shows them on hover and focus. The tooltip repeats the name rather than
  describing it, so its `aria-describedby` is dropped from the link, as
  `IconButton` does; it costs the bits-ui tooltip runtime, which is why the
  default (`'always'`) renders no tooltip at all.

  ARIA contract: `<nav aria-label={label}>` around a `<ul>` of links;
  `header` and `footer` sit outside the landmark, in the column (as in
  `Sidebar`), so an account `Menu` there is not a landmark nested in it. A
  link's name is its label plus the badge's words (`badgeLabel`, "3 new") in
  `VisuallyHidden`; the icon and the visual badge are `aria-hidden`. The
  current destination (the context's `isCurrent`) is `aria-current="page"`,
  and selection is never colour alone: it also takes `currentIcon` (a filled
  variant) and the indicator pill. Every link is at least 48×48.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Tooltip from '../ui/Tooltip.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import type { NavDestination } from './nav-destination.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The app's top-level destinations, in order. */
    destinations: readonly NavDestination[];
    /**
     * The landmark's accessible name.
     * @defaultValue `'Primary'`
     */
    label?: string | undefined;
    /** Above the destinations: a FAB, a menu button or the brand mark. */
    header?: Snippet<[]> | undefined;
    /** Pinned under the destinations: the account block. */
    footer?: Snippet<[]> | undefined;
    /**
     * Show every label under its icon, or only the current one's (the others
     * stay the links' names, and show as a tooltip on hover and focus).
     * @defaultValue `'always'`
     */
    labels?: 'always' | 'current' | undefined;
    /**
     * A badge's text for assistive technology, after the label.
     * @defaultValue `"<badge> new"`
     */
    badgeLabel?: ((badge: string | number) => string) | undefined;
  }

  let {
    destinations,
    label = 'Primary',
    header,
    footer,
    labels = 'always',
    badgeLabel = (value) => `${value} new`,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const items = $derived(
    destinations.map((destination) => {
      const href = context.href(destination.href);
      return { destination, href, current: context.isCurrent(href) };
    }),
  );

  /** The tooltip trigger's props, minus what an `<a>` must not carry (the name is no description). */
  const linkProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const { 'aria-describedby': _describedBy, disabled: _disabled, type: _type, ...kept } = props;
    return kept;
  };
</script>

{#snippet link(
  destination: NavDestination,
  href: string,
  current: boolean,
  props: Record<string, unknown>,
)}
  <a
    {...linkProps(props)}
    {href}
    aria-current={current ? 'page' : undefined}
    class={[
      'flex min-h-12 w-full min-w-12 flex-col items-center justify-center gap-1 text-xs',
      current ? 'text-base-content font-semibold' : 'text-base-content/70',
    ]}
  >
    <span
      aria-hidden="true"
      class={[
        'relative inline-flex rounded-full px-4 py-1',
        current && 'bg-primary/15 text-primary',
      ]}
    >
      <span class="inline-flex size-6 items-center justify-center">
        {@render (current ? (destination.currentIcon ?? destination.icon) : destination.icon)()}
      </span>
      {#if destination.badge !== undefined}
        <span class="badge badge-primary badge-xs absolute end-1 top-0">{destination.badge}</span>
      {/if}
    </span>
    {#if labels === 'always' || current}
      <span>{destination.label}</span>
    {:else}
      <VisuallyHidden>{destination.label}</VisuallyHidden>
    {/if}
    {#if destination.badge !== undefined}
      <VisuallyHidden>{badgeLabel(destination.badge)}</VisuallyHidden>
    {/if}
  </a>
{/snippet}

<div
  {...rest}
  class={[
    'bg-base-100 border-base-300 flex w-20 shrink-0 flex-col items-center gap-3 border-e py-4',
    className,
  ]}
>
  {#if header}<div class="flex flex-col items-center">{@render header()}</div>{/if}
  <nav aria-label={label} class="w-full flex-1">
    <ul class="flex w-full flex-col items-center gap-3">
      {#each items as { destination, href, current } (destination.href)}
        <li class="w-full px-1">
          {#if labels === 'current' && !current}
            <Tooltip text={destination.label} side="right">
              {#snippet children({ props })}
                {@render link(destination, href, current, props)}
              {/snippet}
            </Tooltip>
          {:else}
            {@render link(destination, href, current, {})}
          {/if}
        </li>
      {/each}
    </ul>
  </nav>
  {#if footer}<div class="flex flex-col items-center">{@render footer()}</div>{/if}
</div>
