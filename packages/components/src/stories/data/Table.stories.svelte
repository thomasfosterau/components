<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Table from '../../lib/data/Table.svelte';
  import type { SortState, TableColumn } from '../../lib/data/table-types.ts';
  import Badge from '../../lib/ui/Badge.svelte';
  import Link from '../../lib/ui/Link.svelte';

  interface Plant {
    readonly id: string;
    readonly name: string;
    readonly family: string;
    readonly sown: string;
    readonly count: number;
    readonly status: 'Growing' | 'Harvested' | 'Failed';
  }

  const plants: readonly Plant[] = [
    { id: '1', name: 'Basil ‘Genovese’', family: 'Lamiaceae', sown: '12 Sep', count: 30, status: 'Growing' },
    { id: '2', name: 'Tomato ‘Black Krim’', family: 'Solanaceae', sown: '02 Sep', count: 9, status: 'Growing' },
    { id: '3', name: 'Garlic ‘Monaro Purple’', family: 'Amaryllidaceae', sown: '21 Apr', count: 100, status: 'Harvested' },
    { id: '4', name: 'Broad bean ‘Aquadulce’', family: 'Fabaceae', sown: '04 May', count: 0, status: 'Failed' },
  ];

  const rowKey = (plant: Plant): string => plant.id;

  const { Story } = defineMeta({
    title: 'Data/Table',
    component: Table,
    parameters: {
      docs: {
        description: {
          component:
            'Columns in, rows out. The table presents the window it is given and never chooses which rows exist — sorting reports the change and the caller (or `DataGrid`) does the reordering, so one component serves a client-side grid over 40 rows and a server-paged listing over 40,000.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let sort = $state<SortState | undefined>({ key: 'name', direction: 'asc' });

  // `$derived.by`, not a plain `const`: the `cell` snippets below are declared
  // in the template, so the list has to be built when it is first READ (during
  // render) rather than while the instance script is still running.
  const columns: readonly TableColumn<Plant>[] = $derived.by(() => [
    { key: 'name', header: 'Plant', value: (plant) => plant.name, sortable: true, cell: nameCell },
    { key: 'family', header: 'Family', value: (plant) => plant.family },
    { key: 'sown', header: 'Sown', value: (plant) => plant.sown },
    { key: 'count', header: 'Seedlings', value: (plant) => plant.count, sortable: true, align: 'end' },
    { key: 'status', header: 'Status', value: (plant) => plant.status, cell: statusCell },
  ]);

  const plainColumns: readonly TableColumn<Plant>[] = [
    { key: 'name', header: 'Plant', value: (plant) => plant.name },
    { key: 'count', header: 'Seedlings', value: (plant) => plant.count, align: 'end' },
  ];

  const tones = { Growing: 'success', Harvested: 'neutral', Failed: 'error' } as const;

  let selected = $state('');
</script>

{#snippet nameCell(plant: Plant)}
  <Link href={`/plants/${plant.id}`}>{plant.name}</Link>
{/snippet}

{#snippet statusCell(plant: Plant)}
  <Badge tone={tones[plant.status]} size="sm">{plant.status}</Badge>
{/snippet}

<Story name="Sortable">
  <Table rows={plants} {columns} {rowKey} bind:sort caption="Everything sown this season" />
</Story>

<Story name="Row headers">
  <!-- The plant column names each row, so a screen reader moving down
       "Seedlings" hears "Basil ‘Genovese’, 30" rather than a bare "30". -->
  <Table
    rows={plants}
    columns={plainColumns.map((column) => (column.key === 'name' ? { ...column, rowHeader: true } : column))}
    {rowKey}
    caption="Seedlings per plant"
  />
</Story>

<Story name="Caption hidden">
  <section>
    <h2 class="mb-2 text-xl font-semibold">Everything sown this season</h2>
    <!-- The page heading already shows the name, so the caption is kept for
         assistive technology only rather than printed twice. -->
    <Table rows={plants} {columns} {rowKey} caption="Everything sown this season" captionHidden />
  </section>
</Story>

<Story name="Zebra, small, pinned">
  <div class="max-h-48">
    <Table
      rows={plants}
      columns={plainColumns}
      {rowKey}
      caption="A scrolling window"
      captionHidden
      size="sm"
      zebra
      pinRows
      containerClass="max-h-48"
    />
  </div>
</Story>

<Story name="Selectable rows">
  <div class="space-y-2">
    <Table
      rows={plants}
      columns={plainColumns}
      {rowKey}
      caption="Pick a plant"
      onSelect={(plant) => {
        selected = plant.name;
      }}
    />
    <p class="text-base-content/70 text-sm">Selected: {selected === '' ? '—' : selected}</p>
  </div>
</Story>

<Story name="With a footer">
  <Table rows={plants} columns={plainColumns} {rowKey} caption="Seedlings by plant">
    {#snippet foot()}
      <th scope="row">Total</th>
      <td class="text-end">139</td>
    {/snippet}
  </Table>
</Story>

<Story name="Empty">
  <Table
    rows={[]}
    {columns}
    {rowKey}
    caption="Everything sown this season"
    emptyMessage="Nothing sown yet — start with something quick."
  />
</Story>
