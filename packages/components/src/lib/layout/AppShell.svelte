<!-- @component
The responsive app frame: a sidebar column with a navigation drawer below `lg`, or, given `destinations`, a bottom bar, rail or sidebar by width.
-->
<!--
  AppShell — the frame every app with a `Sidebar` rebuilt by hand. From
  `lg` up the `sidebar` snippet is a plain column beside the content; below
  `lg` it moves into a `Drawer` (`side="start"`) opened from a top bar's
  menu button.

  The persistent column is never inside a dialog. The sidebar renders in
  two places, but the column is `display: none` below `lg` and the drawer
  only exists while it is open (and only its trigger bar below `lg`), so
  exactly one copy, and one `navigation` landmark, is in the accessibility
  tree at any width.

  Closing the drawer on navigation is the app's job, because a library
  cannot import `$app/navigation`. Bind `navOpen` and reset it in
  SvelteKit's `afterNavigate(() => (navOpen = false))`, as with
  `Navbar`'s `menuOpen`.

  Adaptive mode (`destinations` given; #206) declares the app's
  destinations once and renders them three ways, Compose's
  `NavigationSuiteScaffold`: below `breakpoints.medium` a `BottomNav` (only
  the destinations whose `compact` is not `false`), from `medium` up to
  `breakpoints.expanded` a `NavigationRail` (`brand` in its header,
  `account` in its footer), and from `expanded` up the `sidebar` snippet, or
  a `Sidebar` of `MenuItem`s built from the destinations. There is no
  drawer and no `matchMedia`: the three tiers are all rendered and CSS
  (`display: none`, from the literal tables in `nav-destination.ts`) hides
  the two inactive ones, so the server's markup is right at every width and
  exactly one `navigation` landmark, named `label`, is in the accessibility
  tree at any width. `header`, `navOpen`, `navLabel` and `navTitle` belong
  to the drawer and do nothing here.
-->
<script lang="ts">
  import { Menu as MenuIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Drawer from '../feedback/Drawer.svelte';
  import Button from '../ui/Button.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import BottomNav from './BottomNav.svelte';
  import BottomNavItem from './BottomNavItem.svelte';
  import NavigationRail from './NavigationRail.svelte';
  import Sidebar from './Sidebar.svelte';
  import {
    compactPadding,
    compactTier,
    expandedTier,
    mediumTier,
    type NavBreakpoints,
    type NavDestination,
  } from './nav-destination.ts';

  interface Common extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /**
     * The top bar below `lg`; spread `triggerProps` onto the menu button.
     * Omitted, a bar with a menu button. Drawer mode only.
     */
    header?: Snippet<[{ triggerProps: Record<string, unknown> }]> | undefined;
    /** The page content. */
    children: Snippet<[]>;
    /** Whether the narrow-viewport drawer is open. Bindable. Drawer mode only. */
    navOpen?: boolean | undefined;
    /**
     * Accessible name of the default menu button. Drawer mode only.
     * @defaultValue `'Menu'`
     */
    navLabel?: string | undefined;
    /**
     * The drawer's accessible name. Drawer mode only.
     * @defaultValue `'Navigation'`
     */
    navTitle?: string | undefined;
    /**
     * The navigation landmark's accessible name, at every width. Adaptive mode only.
     * @defaultValue `'Primary'`
     */
    label?: string | undefined;
    /** The brand mark: the built sidebar's `brand` and the rail's header. Adaptive mode only. */
    brand?: Snippet<[]> | undefined;
    /** The account block: the built sidebar's and the rail's `footer`. Adaptive mode only. */
    account?: Snippet<[]> | undefined;
    /**
     * Where the bottom bar gives way to the rail (`medium`) and the rail to
     * the sidebar (`expanded`). Adaptive mode only.
     * @defaultValue `{ medium: 'md', expanded: 'lg' }`
     */
    breakpoints?: NavBreakpoints | undefined;
    /**
     * A destination badge's text for assistive technology, after the label. Adaptive mode only.
     * @defaultValue `"<badge> new"`
     */
    badgeLabel?: ((badge: string | number) => string) | undefined;
  }

  interface DrawerMode {
    /** The sidebar, usually a `Sidebar`: a column from `lg` up, the drawer's body below. */
    sidebar: Snippet<[]>;
    /** Omitted: drawer mode. */
    destinations?: undefined;
  }

  interface AdaptiveMode {
    /** The app's top-level destinations: a bottom bar, a rail or a sidebar by width. */
    destinations: readonly NavDestination[];
    /** The expanded tier's sidebar. Omitted, a `Sidebar` built from `destinations`. */
    sidebar?: Snippet<[]> | undefined;
  }

  type Props = Common & (DrawerMode | AdaptiveMode);

  let {
    sidebar,
    destinations,
    header,
    children,
    navOpen = $bindable(false),
    navLabel = 'Menu',
    navTitle = 'Navigation',
    label = 'Primary',
    brand,
    account,
    breakpoints = { medium: 'md', expanded: 'lg' },
    badgeLabel = (value) => `${value} new`,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  /** The destinations the compact bar holds: all but `compact: false`. */
  const inBar = (list: readonly NavDestination[]): readonly NavDestination[] =>
    list.filter((destination) => destination.compact !== false);

  /** A destination's icon in the built sidebar: `currentIcon` while it is the current page. */
  const sidebarIcon = (destination: NavDestination): Snippet<[]> =>
    destination.currentIcon !== undefined &&
    context.isCurrent(context.href(destination.href))
      ? destination.currentIcon
      : destination.icon;
</script>

{#snippet drawerMode(column: Snippet<[]>)}
  <div {...rest} class={['min-h-svh lg:flex', className]}>
    <div class="hidden shrink-0 lg:block">{@render column()}</div>
    <div class="min-w-0 flex-1">
      <div class="lg:hidden">
        <Drawer bind:open={navOpen} title={navTitle} hideTitle side="start" size="sm">
          {#snippet trigger({ props })}
            {#if header}
              {@render header({ triggerProps: props })}
            {:else}
              <div class="border-base-300 bg-base-100 flex h-14 items-center border-b px-2">
                <Button {...props} variant="ghost" class="btn-square">
                  <MenuIcon class="size-5" aria-hidden="true" />
                  <VisuallyHidden>{navLabel}</VisuallyHidden>
                </Button>
              </div>
            {/if}
          {/snippet}
          {@render column()}
        </Drawer>
      </div>
      {@render children()}
    </div>
  </div>
{/snippet}

{#snippet builtSidebar(list: readonly NavDestination[])}
  <Sidebar {label} {brand} footer={account}>
    {#each list as destination (destination.href)}
      <MenuItem href={destination.href} icon={sidebarIcon(destination)}>
        {destination.label}
        {#if destination.badge !== undefined}
          <span aria-hidden="true" class="badge badge-primary badge-sm ms-auto">
            {destination.badge}
          </span>
          <VisuallyHidden>{badgeLabel(destination.badge)}</VisuallyHidden>
        {/if}
      </MenuItem>
    {/each}
  </Sidebar>
{/snippet}

{#snippet adaptiveMode(list: readonly NavDestination[])}
  <div {...rest} class={['flex min-h-svh', className]}>
    <div class={['shrink-0', expandedTier[breakpoints.expanded]]}>
      {#if sidebar}{@render sidebar()}{:else}{@render builtSidebar(list)}{/if}
    </div>
    <div class={['shrink-0', mediumTier[breakpoints.medium][breakpoints.expanded]]}>
      <NavigationRail destinations={list} {label} header={brand} footer={account} {badgeLabel} />
    </div>
    <div class={['min-w-0 flex-1', compactPadding[breakpoints.medium]]}>{@render children()}</div>
    <BottomNav {label} class={compactTier[breakpoints.medium]}>
      {#each inBar(list) as destination (destination.href)}
        <BottomNavItem
          href={destination.href}
          label={destination.label}
          icon={destination.icon}
          currentIcon={destination.currentIcon}
          badge={destination.badge}
          {badgeLabel}
        />
      {/each}
    </BottomNav>
  </div>
{/snippet}

{#if destinations !== undefined}
  {@render adaptiveMode(destinations)}
{:else if sidebar !== undefined}
  {@render drawerMode(sidebar)}
{/if}
