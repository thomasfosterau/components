<script lang="ts">
  import { untrack } from 'svelte';
  import DashboardGrid from '../../../src/lib/layout/DashboardGrid.svelte';
  import type { DashboardColumns, TileLayout } from '../../../src/lib/layout/dashboard.ts';

  interface Props {
    layout: TileLayout[];
    columns?: number | DashboardColumns | undefined;
    defaultLayout?: readonly TileLayout[] | undefined;
    editing?: boolean | undefined;
    onLayoutChange?: ((layout: TileLayout[]) => void) | undefined;
  }

  let { layout, columns = 3, defaultLayout, editing = false, onLayoutChange }: Props = $props();
  let current = $state(untrack(() => layout));
  let edit = $state(untrack(() => editing));
</script>

{#snippet rainfall()}<p>12 mm this week</p>{/snippet}
{#snippet frost()}<p>No frost forecast</p>{/snippet}
{#snippet harvest()}<p>3 beds ready</p>{/snippet}
{#snippet soil()}<p>Moist</p>{/snippet}

<DashboardGrid
  tiles={[
    { id: 'rainfall', title: 'Rainfall', content: rainfall },
    { id: 'frost', title: 'Frost', content: frost, sizes: ['sm', 'wide'] },
    { id: 'harvest', title: 'Harvest', content: harvest },
    { id: 'soil', title: 'Soil', content: soil },
  ]}
  bind:layout={current}
  bind:editing={edit}
  {columns}
  {defaultLayout}
  rowHeight="6rem"
  {onLayoutChange}
/>
