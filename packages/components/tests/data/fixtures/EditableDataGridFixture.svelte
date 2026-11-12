<!-- An editing `DataGrid` over plants: a text, a number, a select and a
     checkbox column, a read-only one, and the bound `changes` printed so a
     test can read them. -->
<script lang="ts">
  import { CalendarDate } from '@internationalized/date';
  import DataGrid from '../../../src/lib/data/DataGrid.svelte';
  import type {
    CellChange,
    CellEditorContext,
    TableColumn,
  } from '../../../src/lib/data/table-types.ts';

  interface Plant {
    readonly id: string;
    readonly name: string;
    readonly count: number;
    readonly kind: string;
    readonly organic: boolean;
    readonly origin: string;
    readonly planted?: CalendarDate | undefined;
    readonly note?: string | undefined;
  }

  interface Props {
    editing?: 'none' | 'cell' | 'batch' | undefined;
    onCellCommit?: ((change: CellChange<Plant>, signal: AbortSignal) => Promise<void>) | undefined;
    pageSize?: number | undefined;
    selection?: 'none' | 'single' | 'multiple' | undefined;
    errorsLabel?: ((count: number) => string) | undefined;
    changedLabel?: string | undefined;
    /** Apply each `'cell'` commit to the rows before resolving, as a caller would. */
    persist?: boolean | undefined;
    initial?: readonly Plant[] | undefined;
    /** Add a date column and a snippet-edited column. */
    more?: boolean | undefined;
  }

  let {
    editing = 'cell',
    onCellCommit,
    pageSize,
    selection,
    errorsLabel,
    changedLabel,
    persist = true,
    more = false,
    initial = [
      { id: 'basil', name: 'Basil', count: 30, kind: 'herb', organic: true, origin: 'India' },
      { id: 'tomato', name: 'Tomato', count: 9, kind: 'fruit', organic: false, origin: 'Peru' },
      { id: 'garlic', name: 'Garlic', count: 100, kind: 'bulb', organic: false, origin: 'Asia' },
    ],
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let rows = $state<readonly Plant[]>(initial);
  let changes = $state<CellChange<Plant>[]>([]);

  const columns: readonly TableColumn<Plant>[] = [
    {
      key: 'name',
      header: 'Name',
      value: (row) => row.name,
      sortable: true,
      editable: true,
      validate: (value) => (value === '' ? ['Enter a name.'] : []),
    },
    {
      key: 'count',
      header: 'Count',
      value: (row) => row.count,
      align: 'end',
      editable: true,
      editor: 'number',
      validate: (value) => (typeof value === 'number' && value < 0 ? ['Must not be negative.'] : []),
    },
    {
      key: 'kind',
      header: 'Kind',
      value: (row) => row.kind,
      editable: (row) => row.id !== 'garlic',
      editor: 'select',
      options: [
        { value: 'herb', label: 'Herb' },
        { value: 'fruit', label: 'Fruit' },
        { value: 'bulb', label: 'Bulb' },
      ],
    },
    {
      key: 'organic',
      header: 'Organic',
      value: (row) => (row.organic ? 'Yes' : 'No'),
      editValue: (row) => row.organic,
      editable: true,
      editor: 'checkbox',
    },
    { key: 'origin', header: 'Origin', value: (row) => row.origin },
  ];

  const moreColumns: readonly TableColumn<Plant>[] = [
    {
      key: 'planted',
      header: 'Planted',
      value: (row) => row.planted?.toString() ?? '',
      editValue: (row) => row.planted ?? new CalendarDate(2026, 3, 1),
      editable: true,
      editor: 'date',
    },
    {
      key: 'note',
      header: 'Note',
      value: (row) => row.note ?? '',
      editable: true,
      editor: noteEditor,
    },
  ];

  const patch = (row: Plant, column: string, to: unknown): Plant => ({ ...row, [column]: to });

  const commit = async (change: CellChange<Plant>, signal: AbortSignal): Promise<void> => {
    await onCellCommit?.(change, signal);
    if (persist) {
      rows = rows.map((row) => (row.id === change.rowKey ? patch(row, change.column, change.to) : row));
    }
  };
</script>

{#snippet noteEditor({ value, update, commit, control }: CellEditorContext<Plant>)}
  <input
    id={control.id}
    aria-labelledby={control.labelId}
    value={typeof value === 'string' ? value : ''}
    oninput={(event) => update(event.currentTarget.value.toUpperCase())}
  />
  <button type="button" onclick={() => commit('Done')}>Done</button>
{/snippet}

<DataGrid
  {rows}
  columns={more ? [...columns, ...moreColumns] : columns}
  rowKey={(row) => row.id}
  caption="Plants"
  {editing}
  onCellCommit={commit}
  paginated={pageSize !== undefined}
  {pageSize}
  {selection}
  {errorsLabel}
  {changedLabel}
  bind:changes
/>

<button type="button">After</button>
<p data-testid="changes">
  {changes.map((change) => `${change.rowKey}.${change.column}:${String(change.from)}>${String(change.to)}`).join(',')}
</p>
<p data-testid="rows">{rows.map((row) => `${row.name}=${row.count}`).join(',')}</p>
