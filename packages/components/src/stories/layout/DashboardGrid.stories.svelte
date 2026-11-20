<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DashboardGrid from '../../lib/layout/DashboardGrid.svelte';
  import type { DashboardTile, TileLayout } from '../../lib/layout/dashboard.ts';

  const { Story } = defineMeta({
    title: 'Layout/DashboardGrid',
    component: DashboardGrid,
    parameters: {
      docs: {
        description: {
          component:
            'Tiles the reader arranges. "Edit dashboard" shows each tile\'s Move handle (drag, or Space and the arrow keys) and options menu (size presets, move in reading order, remove), plus Add widget and Reset layout. The DOM order always follows the layout, and a grid narrower than the stored layout stacks in reading order.',
        },
      },
    },
  });

  const defaults: TileLayout[] = [
    { id: 'beds', x: 0, y: 0, w: 2, h: 1 },
    { id: 'rainfall', x: 2, y: 0, w: 1, h: 1 },
    { id: 'frost', x: 3, y: 0, w: 1, h: 1 },
    { id: 'map', x: 0, y: 1, w: 2, h: 2 },
    { id: 'tasks', x: 2, y: 1, w: 2, h: 2 },
  ];
</script>

<script lang="ts">
  let overview = $state<TileLayout[]>([...defaults]);
  let editing = $state<TileLayout[]>([...defaults]);
  let narrow = $state<TileLayout[]>([...defaults]);

  const tiles: DashboardTile[] = [
    { id: 'beds', title: 'Beds in use', content: beds, sizes: ['md', 'wide'] },
    { id: 'rainfall', title: 'Rainfall', content: rainfall, sizes: ['sm', 'md', 'tall'] },
    { id: 'frost', title: 'Frost', content: frost },
    { id: 'map', title: 'Garden map', content: map, sizes: ['md', 'lg', 'wide'] },
    { id: 'tasks', title: 'This week', content: tasks, sizes: ['md', 'lg', 'tall'] },
  ];
</script>

{#snippet beds()}
  <p class="text-3xl font-semibold">
    31 <span class="text-base-content/70 text-sm font-normal">2 fewer than last month</span>
  </p>
{/snippet}
{#snippet rainfall()}
  <p class="text-3xl font-semibold">
    12 mm <span class="text-base-content/70 text-sm font-normal">this week</span>
  </p>
{/snippet}
{#snippet frost()}<p class="text-base-content/70 text-sm">None forecast for 10 days.</p>{/snippet}
{#snippet map()}
  <div class="bg-base-200 rounded-box text-base-content/60 grid h-full place-items-center text-sm">
    Map
  </div>
{/snippet}
{#snippet tasks()}
  <ul class="list-disc ps-5 text-sm">
    <li>Sow broad beans in bed 4</li>
    <li>Net the brassicas</li>
    <li>Turn the compost</li>
  </ul>
{/snippet}

{#snippet dashboard(layout: TileLayout[], edit: boolean, set: (next: TileLayout[]) => void)}
  <DashboardGrid
    {tiles}
    {layout}
    onLayoutChange={set}
    defaultLayout={defaults}
    columns={4}
    rowHeight="8rem"
    editing={edit}
  />
{/snippet}

<Story name="Garden overview">
  {#snippet template()}
    {@render dashboard(overview, false, (next) => (overview = next))}
  {/snippet}
</Story>

<Story name="Edit mode">
  {#snippet template()}
    {@render dashboard(editing, true, (next) => (editing = next))}
  {/snippet}
</Story>

<Story name="Narrow">
  {#snippet template()}
    <div style="max-width: 360px">
      <DashboardGrid
        {tiles}
        bind:layout={narrow}
        defaultLayout={defaults}
        editing
        rowHeight="8rem"
      />
    </div>
  {/snippet}
</Story>
