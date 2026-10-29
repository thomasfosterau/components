<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import AppShell from '../../lib/layout/AppShell.svelte';
  import Sidebar from '../../lib/layout/Sidebar.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';

  const { Story } = defineMeta({
    title: 'Layout/AppShell',
    component: AppShell,
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            'The sidebar as a standing column from `lg` up, and in a navigation drawer below it. Resize the canvas (or use the viewport toolbar) to see both. Exactly one `navigation` landmark is in the tree at any width.',
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
