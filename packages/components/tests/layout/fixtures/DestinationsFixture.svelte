<!-- A Sidebar or a BottomNav built from `destinations`, under a context that
     prefixes hrefs with /en and treats /en/gardens as the current page.
     `withChildren` adds one hand-written item after the destinations. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import BottomNav from '../../../src/lib/layout/BottomNav.svelte';
  import BottomNavItem from '../../../src/lib/layout/BottomNavItem.svelte';
  import type { NavDestination } from '../../../src/lib/layout/nav-destination.ts';
  import Sidebar from '../../../src/lib/layout/Sidebar.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';

  interface Props {
    component: 'sidebar' | 'bottom-nav';
    withChildren?: boolean;
  }

  let { component, withChildren = false }: Props = $props();

  setComponentsContext({
    href: (path) => `/en${path}`,
    isCurrent: (resolved) => resolved === '/en/gardens',
  });

  const destinations: readonly NavDestination[] = [
    { href: '/gardens', label: 'Gardens', icon, currentIcon: filled },
    { href: '/taxa', label: 'Taxa', icon },
    { href: '/notifications', label: 'Notifications', icon, badge: 3 },
    { href: '/settings', label: 'Settings', icon, compact: false },
  ];
</script>

{#snippet icon()}
  <svg viewBox="0 0 16 16" data-testid="outline"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}
{#snippet filled()}
  <svg viewBox="0 0 16 16" data-testid="filled"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}
{#snippet extraSidebarItem()}
  <MenuItem href="/extra">Extra</MenuItem>
{/snippet}
{#snippet extraBarItem()}
  <BottomNavItem href="/extra" label="Extra" {icon} />
{/snippet}

{#if component === 'sidebar'}
  <Sidebar {destinations} children={withChildren ? extraSidebarItem : undefined} />
{:else}
  <BottomNav fixed={false} {destinations} children={withChildren ? extraBarItem : undefined} />
{/if}
