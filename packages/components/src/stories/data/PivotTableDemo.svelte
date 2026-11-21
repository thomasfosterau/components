<script lang="ts">
  import PivotTable from '../../lib/data/PivotTable.svelte';
  import type { PivotConfig } from '../../lib/data/pivot.ts';
  import type { PivotField } from '../../lib/data/pivot-fields.ts';

  interface Harvest {
    readonly bed: string;
    readonly crop: string;
    readonly picked: string;
    readonly kg: number;
  }

  interface Props {
    initial: PivotConfig<Harvest>;
    configurable?: boolean | undefined;
    subtotals?: boolean | undefined;
    grandTotals?: boolean | undefined;
  }

  let { initial, configurable = true, subtotals = true, grandTotals = true }: Props = $props();
  // svelte-ignore state_referenced_locally
  let config = $state(initial);

  const crops = ['Tomato', 'Basil', 'Zucchini', 'Bean'];
  const beds = ['Bed 1', 'Bed 2', 'Bed 3', 'Bed 10'];
  const data: Harvest[] = Array.from({ length: 96 * 2 }, (_, index) => ({
    bed: beds[index % 4] ?? 'Bed 1',
    crop: crops[Math.floor(index / 4) % 4] ?? 'Tomato',
    picked: `2026-${String((Math.floor(index / 16) % 6) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    kg: Math.round(((index * 37) % 50) + 5) / 10,
  }));

  const fields: PivotField<Harvest>[] = [
    { name: 'bed', label: 'Bed' },
    { name: 'crop', label: 'Crop' },
    { name: 'picked', label: 'Picked' },
    { name: 'kg', label: 'kg', kind: 'measure' },
  ];
</script>

<PivotTable
  {data}
  bind:config
  {fields}
  {configurable}
  {subtotals}
  {grandTotals}
  locales="en-AU"
  caption="Harvest by bed and month"
/>
