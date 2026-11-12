<!-- @component
The app shell’s navigation column: a brand mark, the primary links and an account block.
-->
<!--
  Sidebar — the app shell's standing navigation column: a brand mark at the
  top, the primary links in the middle, an account block at the bottom.

  A thin composition and nothing more. The links themselves are `MenuItem`s
  inside a `Menu`, which already owns the whole navigation
  contract — the `<nav aria-label>` landmark, the `<ul class="menu">`, and
  `aria-current="page"` on the item the reader is on. This adds only what a
  sidebar has and a menu does not.

  What it deliberately does NOT do is wrap the column in an `<aside>`, which
  is what that original did. `<aside>` is the `complementary` landmark — "content
  related to the main content, meaningful on its own" — and a site's primary
  navigation is neither. Wrapping it makes the app's most important landmark
  announce itself as an afterthought, and puts a second landmark around the
  `navigation` one, which a reader then has to step through twice.

  Given `destinations` (#428), the links are built from the app's one list of
  `NavDestination`s, the same declaration `AppShell` and `NavigationRail`
  read, so an app without `AppShell` declares them once; `children` still
  work, and render after them.

  ARIA contract: the navigation landmark is `Menu`'s. When `title` is shown,
  it is also the landmark's accessible name by default, so the name a reader
  hears is the text a reader sees. `brand` and `footer` are plain regions: the
  brand is a link, the footer block is usually a second short `Menu`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Menu from '../ui/Menu.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import type { NavDestination } from './nav-destination.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /**
     * Accessible name of the navigation landmark. Defaults to `title` when
     * one is shown, and to `Primary` when it is not.
     */
    label?: string | undefined;
    /** A visible heading over the links ("Browse", "Your account"). */
    title?: string | undefined;
    /**
     * The heading level, so the page outline stays intact.
     * @defaultValue `2`
     */
    headingLevel?: HeadingLevel | undefined;
    /** The brand mark, above the links. */
    brand?: Snippet<[]> | undefined;
    /** A block pinned under the links — the signed-in account menu. */
    footer?: Snippet<[]> | undefined;
    /**
     * The app's top-level destinations, built into `MenuItem`s (the current
     * one shows its `currentIcon`; a badge is named in words by `badgeLabel`).
     * Rendered before `children`.
     */
    destinations?: readonly NavDestination[] | undefined;
    /**
     * A destination badge's text for assistive technology, after the label.
     * @defaultValue `"<badge> new"`
     */
    badgeLabel?: ((badge: string | number) => string) | undefined;
    /** Further `MenuItem`s, after the `destinations`. */
    children?: Snippet<[]> | undefined;
  }

  let {
    label,
    title,
    headingLevel = 2,
    brand,
    footer,
    destinations,
    badgeLabel = (value) => `${value} new`,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const navLabel = $derived(label ?? title ?? 'Primary');

  const context = getComponentsContext();

  /** A destination's icon: `currentIcon` while it is the current page. */
  const iconOf = (destination: NavDestination): Snippet<[]> =>
    destination.currentIcon !== undefined && context.isCurrent(context.href(destination.href))
      ? destination.currentIcon
      : destination.icon;
</script>

<div
  {...rest}
  class={['bg-base-100 border-base-300 flex min-h-full w-72 flex-col border-r', className]}
>
  {#if brand}
    <div class="flex h-16 shrink-0 items-center px-6">{@render brand()}</div>
  {/if}

  <div class="min-h-0 flex-1 space-y-2 px-4 py-2">
    {#if title !== undefined}
      <svelte:element
        this={`h${headingLevel}`}
        class="text-base-content/60 px-1 text-xs font-semibold tracking-wide uppercase"
      >
        {title}
      </svelte:element>
    {/if}
    <Menu label={navLabel}>
      {#each destinations ?? [] as destination (destination.href)}
        <MenuItem href={destination.href} icon={iconOf(destination)}>
          {destination.label}
          {#if destination.badge !== undefined}
            <span aria-hidden="true" class="badge badge-primary badge-sm ms-auto">
              {destination.badge}
            </span>
            <VisuallyHidden>{badgeLabel(destination.badge)}</VisuallyHidden>
          {/if}
        </MenuItem>
      {/each}
      {@render children?.()}
    </Menu>
  </div>

  {#if footer}
    <div class="border-base-300 shrink-0 border-t px-4 py-4">{@render footer()}</div>
  {/if}
</div>
