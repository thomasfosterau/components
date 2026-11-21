<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PivotTable from '../../lib/data/PivotTable.svelte';
  import PivotTableDemo from './PivotTableDemo.svelte';

  const { Story } = defineMeta({
    title: 'Data/PivotTable',
    component: PivotTable,
    parameters: {
      docs: {
        description: {
          component:
            'A cross-tab of flat records: fields on rows and columns, measures aggregated in the cells. A real `<table>` whose cells name every header through `headers`, with collapsible row groups, subtotals and totals. Each field chip is a menu that moves it, reorders it or changes its aggregate.',
        },
      },
    },
  });
</script>

<Story name="Beds by month">
  {#snippet template()}
    <PivotTableDemo
      initial={{
        rows: ['bed', 'crop'],
        columns: ['picked'],
        values: [{ field: 'kg', agg: 'sum' }],
        dateGrouping: { picked: 'month' },
      }}
    />
  {/snippet}
</Story>

<Story name="Two measures, no column fields">
  {#snippet template()}
    <PivotTableDemo
      initial={{
        rows: ['crop'],
        columns: [],
        values: [
          { field: 'kg', agg: 'sum' },
          { field: 'kg', agg: 'mean', format: { maximumFractionDigits: 2 } },
        ],
      }}
    />
  {/snippet}
</Story>

<Story name="Fixed layout, no subtotals">
  {#snippet template()}
    <PivotTableDemo
      configurable={false}
      subtotals={false}
      initial={{
        rows: ['bed', 'crop'],
        columns: ['picked'],
        values: [{ field: 'kg', agg: 'sum' }],
        dateGrouping: { picked: 'quarter' },
      }}
    />
  {/snippet}
</Story>
