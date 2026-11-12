<!-- A virtual editing `DataGrid` over a large generated import: fixed 40 px
     rows in a 400 px scroller (inline sizes, because the suite runs without
     Tailwind), and one row far down the list that arrives invalid. -->
<script lang="ts">
  import DataGrid from '../../../src/lib/data/DataGrid.svelte';
  import type { CellChange, TableColumn } from '../../../src/lib/data/table-types.ts';

  interface Plant {
    readonly id: string;
    readonly name: string;
    readonly count: number;
    readonly origin: string;
  }

  interface Props {
    count?: number | undefined;
    /** The 1-based row that arrives with a negative count, if any. */
    invalidAt?: number | undefined;
    editing?: 'cell' | 'batch' | undefined;
  }

  let { count = 5000, invalidAt = 4200, editing = 'batch' }: Props = $props();

  const origins = ['India', 'Peru', 'Asia', 'Chile'];

  // svelte-ignore state_referenced_locally
  const rows: readonly Plant[] = Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Plant ${index + 1}`,
    count: index + 1 === invalidAt ? -4 : (index * 7) % 50,
    origin: origins[index % origins.length] ?? 'Asia',
  }));

  let changes = $state<CellChange<Plant>[]>([]);

  const notNegative = (value: unknown): readonly string[] =>
    typeof value === 'number' && value < 0 ? ['Must not be negative.'] : [];

  // A text, a number and a read-only column.
  const columns: readonly TableColumn<Plant>[] = [
    { key: 'name', header: 'Name', value: (row) => row.name, editable: true },
    { key: 'count', header: 'Count', value: (row) => row.count, editable: true, editor: 'number', validate: notNegative },
    { key: 'origin', header: 'Origin', value: (row) => row.origin },
  ];
</script>

<DataGrid
  {rows}
  {columns}
  rowKey={(row) => row.id}
  caption="Plants"
  {editing}
  onCellCommit={async () => {}}
  virtual
  rowHeight={40}
  viewportHeight="400px"
  bind:changes
/>

<button type="button">After</button>
<p data-testid="changes">
  {changes.map((change) => `${change.rowKey}.${change.column}:${String(change.from)}>${String(change.to)}`).join(',')}
</p>
