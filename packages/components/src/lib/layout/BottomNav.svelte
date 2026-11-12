<!-- @component
The mobile primary navigation: three to five destinations in a bar at the bottom of the viewport, on daisyUI's `dock`.
-->
<!--
  BottomNav — the phone's primary navigation (Material's navigation bar,
  iOS's tab bar): the app's top-level destinations kept one thumb-tap away,
  each a `BottomNavItem` — an icon over a short label. It is what a narrow
  layout shows instead of the `Sidebar`; which breakpoint swaps one for the
  other is the app's, through `class` (`sm:hidden` here, `hidden sm:block` on
  the sidebar). Hide the inactive one with `hidden`, never `invisible` or
  opacity, so only one "Primary" navigation landmark is ever in the tree.

  No bits-ui and no `ui/Menu`: the contract is a landmark, links and
  `aria-current`, which needs no primitive, and `Menu`'s dropdown runtime is
  exactly the always-loaded cost #129 removed.

  Given `destinations` (#428), the items are built from the app's one list of
  `NavDestination`s (all but `compact: false`), the same declaration
  `AppShell` and `NavigationRail` read; `children` still work, and render
  after them.

  ARIA contract: `<nav aria-label>` around a `<ul>` of links, so a screen
  reader hears "3 of 5". Tab order is DOM order — no roving tabindex.

  Fixed (the default), the bar covers the bottom of the page: it sets
  `--bottom-nav-height` on the document root while mounted, so the page can
  pad itself (`pb-(--bottom-nav-height)` on `Main`); daisyUI's height already
  includes `env(safe-area-inset-bottom)`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { dockSize, type Size } from '../ui/tones.ts';
  import BottomNavItem from './BottomNavItem.svelte';
  import { compactDestinations, type NavDestination } from './nav-destination.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /**
     * The landmark's accessible name.
     * @defaultValue `'Primary'`
     */
    label?: string | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * Fix the bar to the bottom of the viewport; `false` lets it sit in flow (a story, a preview).
     * @defaultValue `true`
     */
    fixed?: boolean | undefined;
    /**
     * The app's top-level destinations, built into `BottomNavItem`s; those
     * with `compact: false` are left out. Rendered before `children`.
     */
    destinations?: readonly NavDestination[] | undefined;
    /**
     * A destination badge's text for assistive technology, after the label.
     * @defaultValue `"<badge> new"`
     */
    badgeLabel?: ((badge: string | number) => string) | undefined;
    /** Further `BottomNavItem`s, after the `destinations`. */
    children?: Snippet<[]> | undefined;
  }

  let {
    label = 'Primary',
    size = 'md',
    fixed = true,
    destinations,
    badgeLabel = (value) => `${value} new`,
    class: className,
    children,
    ...rest
  }: Props = $props();

  let bar: HTMLUListElement | undefined = $state();

  // Publish the bar's height for the page's own padding while it is fixed.
  $effect(() => {
    const node = bar;
    if (!fixed || node === undefined || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const publish = (): void => {
      root.style.setProperty('--bottom-nav-height', `${node.offsetHeight}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--bottom-nav-height');
    };
  });
</script>

<nav {...rest} aria-label={label} class={className}>
  <ul
    bind:this={bar}
    class={['dock border-base-300 bg-base-100 border-t', !fixed && 'relative', dockSize[size]]}
  >
    {#each compactDestinations(destinations ?? []) as destination (destination.href)}
      <BottomNavItem
        href={destination.href}
        label={destination.label}
        icon={destination.icon}
        currentIcon={destination.currentIcon}
        badge={destination.badge}
        {badgeLabel}
      />
    {/each}
    {@render children?.()}
  </ul>
</nav>
