<script lang="ts">
  import PivotTable from '../../../src/lib/data/PivotTable.svelte';
  import type { PivotConfig } from '../../../src/lib/data/pivot.ts';
  import type { PivotField } from '../../../src/lib/data/pivot-fields.ts';
  import { harvests, type Harvest } from './harvest.ts';

  interface Props {
    config: PivotConfig<Harvest>;
    locale?: string | undefined;
    subtotals?: boolean | undefined;
  }

  let { config: initial, locale = 'en-AU', subtotals = true }: Props = $props();
  // svelte-ignore state_referenced_locally
  let config = $state(initial);

  const fields: PivotField<Harvest>[] = [
    { name: 'bed', label: 'Bed' },
    { name: 'crop', label: 'Crop' },
    { name: 'date', label: 'Date' },
    { name: 'kg', label: 'kg', kind: 'measure' },
  ];
</script>

<PivotTable
  data={harvests}
  bind:config
  {fields}
  {subtotals}
  locales={locale}
  caption="Harvest by bed"
/>
<span data-testid="rows">{config.rows.join(',')}</span>
