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

  interface Props extends HTMLAttributes<HTMLElement> {
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
    /** The `BottomNavItem`s. */
    children: Snippet<[]>;
  }

  let {
    label = 'Primary',
    size = 'md',
    fixed = true,
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
    {@render children()}
  </ul>
</nav>
