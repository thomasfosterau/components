<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Navbar from '../../lib/layout/Navbar.svelte';
  import NavigationMenu from '../../lib/layout/NavigationMenu.svelte';
  import type { NavigationSection } from '../../lib/layout/types.ts';

  const { Story } = defineMeta({
    title: 'Layout/NavigationMenu',
    component: NavigationMenu,
    parameters: {
      docs: {
        description: {
          component:
            'Site navigation with panels of further links (the APG disclosure navigation pattern, not a menubar): links stay links, Tab walks every one, and Escape returns to the trigger. Render it in `Navbar`’s `center` snippet, and with `orientation="vertical"` in its `menu` snippet, from one `sections` array.',
        },
      },
    },
  });

  const sections: NavigationSection[] = [
    {
      label: 'Plants',
      links: [
        { label: 'Trees', href: '/plants/trees', description: 'Fruit, shade and hedging.' },
        { label: 'Shrubs', href: '/plants/shrubs', description: 'Flowering and evergreen.' },
        { label: 'Bulbs', href: '/plants/bulbs', description: 'Spring and summer colour.' },
        { label: 'Climbers', href: '/plants/climbers', description: 'For walls and arches.' },
      ],
    },
    {
      label: 'Guides',
      links: [
        { label: 'By season', href: '/guides/season' },
        { label: 'By region', href: '/guides/region' },
      ],
    },
    { label: 'Community', href: '/community' },
  ];
</script>

<Story name="Inside Navbar">
  <Navbar label="Primary" menuLabel="Open the site menu">
    {#snippet start()}
      <a href="/" rel="home" class="text-primary text-xl font-bold">Garden guide</a>
    {/snippet}
    {#snippet center()}
      <NavigationMenu {sections} />
    {/snippet}
    {#snippet menu()}
      <NavigationMenu {sections} orientation="vertical" />
    {/snippet}
  </Navbar>
  <div class="h-96"></div>
</Story>

<Story name="Featured panel">
  <NavigationMenu {sections} label="Sections">
    {#snippet panel(section)}
      <div class="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <a href="/featured" class="bg-primary text-primary-content rounded-box flex flex-col justify-end p-4">
          <span class="font-semibold">This month</span>
          <span class="text-sm">What to plant in {section.label.toLowerCase()} now</span>
        </a>
        <ul class="flex flex-col gap-1">
          {#each section.links ?? [] as link (link.href)}
            <li><a class="link link-hover" href={link.href}>{link.label}</a></li>
          {/each}
        </ul>
      </div>
    {/snippet}
  </NavigationMenu>
  <div class="h-96"></div>
</Story>

<Story name="Vertical" parameters={{ viewport: { defaultViewport: 'mobile1' } }}>
  <NavigationMenu {sections} label="Sections" orientation="vertical" />
</Story>
