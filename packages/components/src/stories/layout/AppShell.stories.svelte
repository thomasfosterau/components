<script module lang="ts">
  import { Bell, Leaf, Settings, Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { setComponentsContext } from '../../lib/context.svelte.ts';
  import AppShell from '../../lib/layout/AppShell.svelte';
  import Sidebar from '../../lib/layout/Sidebar.svelte';
  import type { NavDestination } from '../../lib/layout/nav-destination.ts';
  import MenuItem from '../../lib/ui/MenuItem.svelte';

  const { Story } = defineMeta({
    title: 'Layout/AppShell',
    component: AppShell,
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            'The sidebar as a standing column from `lg` up, and in a navigation drawer below it. Given `destinations` (the Adaptive stories), a bottom bar below `md`, a `NavigationRail` from `md` and a `Sidebar` from `lg`, from one list. Resize the canvas (or use the viewport toolbar) to see each. Exactly one `navigation` landmark is in the tree at any width.',
        },
      },
    },
  });
</script>

{#snippet nav()}
  <Sidebar title="Garden">
    <MenuItem href="#beds">Beds</MenuItem>
    <MenuItem href="#plants">Plants</MenuItem>
    <MenuItem href="#calendar">Calendar</MenuItem>
  </Sidebar>
{/snippet}

<Story name="Wide">
  <AppShell sidebar={nav}><main class="p-6"><h1 class="text-2xl font-semibold">Beds</h1></main></AppShell>
</Story>

<Story name="Narrow" parameters={{ viewport: { defaultViewport: 'mobile1' } }}>
  <AppShell sidebar={nav}><main class="p-6"><h1 class="text-2xl font-semibold">Beds</h1></main></AppShell>
</Story>

{#snippet beds()}<Sprout class="size-5" />{/snippet}
{#snippet plants()}<Leaf class="size-5" />{/snippet}
{#snippet inbox()}<Bell class="size-5" />{/snippet}
{#snippet settings()}<Settings class="size-5" />{/snippet}
{#snippet brand()}<a href="#home" rel="home" class="font-semibold">Garden</a>{/snippet}

<script lang="ts">
  // A story has no router: mark one destination current by hand.
  setComponentsContext({ isCurrent: (href) => href === '#beds' });

  const destinations: readonly NavDestination[] = [
    { href: '#beds', label: 'Beds', icon: beds },
    { href: '#plants', label: 'Plants', icon: plants },
    { href: '#inbox', label: 'Inbox', icon: inbox, badge: 3 },
    { href: '#settings', label: 'Settings', icon: settings, compact: false },
  ];
</script>

<Story name="Adaptive">
  <AppShell {destinations} {brand}>
    <main class="p-6"><h1 class="text-2xl font-semibold">Beds</h1></main>
  </AppShell>
</Story>

<Story name="Adaptive, tablet" parameters={{ viewport: { defaultViewport: 'tablet' } }}>
  <AppShell {destinations} {brand}>
    <main class="p-6"><h1 class="text-2xl font-semibold">Beds</h1></main>
  </AppShell>
</Story>

<Story name="Adaptive, phone" parameters={{ viewport: { defaultViewport: 'mobile1' } }}>
  <AppShell {destinations} {brand}>
    <main class="p-6"><h1 class="text-2xl font-semibold">Beds</h1></main>
  </AppShell>
</Story>
