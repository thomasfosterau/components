<script module lang="ts">
  import { Bell, BellRing, Leaf, Pencil, Settings, Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { setComponentsContext } from '../../lib/context.svelte.ts';
  import NavigationRail from '../../lib/layout/NavigationRail.svelte';
  import type { NavDestination } from '../../lib/layout/nav-destination.ts';
  import IconButton from '../../lib/ui/IconButton.svelte';

  const { Story } = defineMeta({
    title: 'Layout/NavigationRail',
    component: NavigationRail,
    parameters: {
      docs: {
        description: {
          component:
            'The medium-width primary navigation: an ~80px column of icon-over-label links, the current one `aria-current="page"` with its filled icon in the indicator pill. `labels="current"` hides the other labels visually (they stay the links’ names) and shows them as a tooltip on hover and focus. `AppShell` shows it between its `medium` and `expanded` breakpoints when given `destinations`.',
        },
      },
    },
  });
</script>

{#snippet gardens()}<Sprout class="size-6" />{/snippet}
{#snippet taxa()}<Leaf class="size-6" />{/snippet}
{#snippet notifications()}<Bell class="size-6" />{/snippet}
{#snippet notificationsCurrent()}<BellRing class="size-6" />{/snippet}
{#snippet settings()}<Settings class="size-6" />{/snippet}
{#snippet pencil()}<Pencil class="size-5" />{/snippet}
{#snippet compose()}
  <IconButton label="New entry" icon={pencil} variant="soft" tone="primary" tooltipSide="right" />
{/snippet}

<script lang="ts">
  // A story has no router: mark one destination current by hand.
  setComponentsContext({ isCurrent: (href) => href === '#notifications' });

  const destinations: readonly NavDestination[] = [
    { href: '#gardens', label: 'Gardens', icon: gardens },
    { href: '#taxa', label: 'Taxa', icon: taxa },
    {
      href: '#notifications',
      label: 'Notifications',
      icon: notifications,
      currentIcon: notificationsCurrent,
      badge: 3,
    },
    { href: '#settings', label: 'Settings', icon: settings, compact: false },
  ];
</script>

<Story name="Labels always">
  <NavigationRail {destinations} header={compose} class="h-[32rem]" />
</Story>

<Story name="Labels on current only">
  <NavigationRail {destinations} labels="current" header={compose} class="h-[32rem]" />
</Story>
