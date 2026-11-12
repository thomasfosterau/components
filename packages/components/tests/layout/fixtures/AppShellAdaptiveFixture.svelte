<!-- AppShell in adaptive mode, under the layout Tailwind subset so the
     tiers' breakpoint classes really hide the inactive two. /beds is current. -->
<script lang="ts">
  import './layout.css';
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import AppShell from '../../../src/lib/layout/AppShell.svelte';
  import type { NavDestination } from '../../../src/lib/layout/nav-destination.ts';

  setComponentsContext({ isCurrent: (href) => href === '/beds' });

  const destinations: readonly NavDestination[] = [
    { href: '/beds', label: 'Beds', icon },
    { href: '/plants', label: 'Plants', icon },
    { href: '/inbox', label: 'Inbox', icon, badge: 2 },
    { href: '/settings', label: 'Settings', icon, compact: false },
  ];
</script>

{#snippet icon()}
  <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /></svg>
{/snippet}
{#snippet brand()}
  <a href="/" rel="home">Garden</a>
{/snippet}

<AppShell {destinations} {brand}>
  <main><h1>Beds</h1></main>
</AppShell>
