<!-- A NavigationRail of four destinations under a context that prefixes
     hrefs with /en and treats /en/inbox as the current page. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import NavigationRail from '../../../src/lib/layout/NavigationRail.svelte';
  import type { NavDestination } from '../../../src/lib/layout/nav-destination.ts';

  interface Props {
    labels?: 'always' | 'current' | undefined;
  }

  let { labels }: Props = $props();

  setComponentsContext({
    href: (path) => `/en${path}`,
    isCurrent: (resolved) => resolved === '/en/inbox',
  });

  const destinations: readonly NavDestination[] = [
    { href: '/inbox', label: 'Inbox', icon, currentIcon, badge: 3 },
    { href: '/beds', label: 'Beds', icon },
    { href: '/plants', label: 'Plants', icon },
    { href: '/settings', label: 'Settings', icon, compact: false },
  ];
</script>

{#snippet icon()}
  <svg viewBox="0 0 16 16" data-testid="icon"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}
{#snippet currentIcon()}
  <svg viewBox="0 0 16 16" data-testid="current-icon"><circle cx="8" cy="8" r="7" /></svg>
{/snippet}
{#snippet header()}
  <button type="button">Compose</button>
{/snippet}

<NavigationRail {destinations} {labels} {header} data-testid="rail" />
