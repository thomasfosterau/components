<!--
  A generic component cannot be rendered straight from a `.ts` test:
  `ComponentProps<typeof Table>` resolves `T` to `unknown`, so the fixture
  data's own `TableColumn<Row>[]` will not assign. This fixture pins `T` to
  `Row` once, and takes the props each test varies.
-->
<script lang="ts">
  import Table from '../../../src/lib/data/Table.svelte';
  import type {
    SortState,
    TableColumn,
    TableRowAttributes,
    TableSelection,
  } from '../../../src/lib/data/table-types.ts';
  import ToolbarButton from '../../../src/lib/ui/ToolbarButton.svelte';
  import type { Size } from '../../../src/lib/ui/tones.ts';
  import { columns, plainColumns, rowKey, rows as allRows, type Row } from './table-data.ts';

  interface Props {
    rows?: readonly Row[];
    /** Use the columns with sort controls, or the plain ones. */
    sortable?: boolean;
    caption?: string | undefined;
    captionHidden?: boolean;
    size?: Size | undefined;
    zebra?: boolean;
    pinRows?: boolean;
    class?: string | undefined;
    emptyMessage?: string | undefined;
    onSort?: ((sort: SortState | undefined) => void) | undefined;
    onSelect?: ((row: Row) => void) | undefined;
    withEmptyState?: boolean;
    withFoot?: boolean;
    /** Make the first column the row header. */
    rowHeader?: boolean;
    /** Classes on the last column's header only. */
    headerClass?: string | undefined;
    rowAttributes?: ((row: Row) => TableRowAttributes) | undefined;
    selection?: TableSelection | undefined;
    /** The selection the fixture starts from. */
    initialSelected?: readonly string[];
    onSelectionChange?: ((selected: Set<string>) => void) | undefined;
    selectRowLabel?: ((row: Row) => string) | undefined;
    selectAllLabel?: string | undefined;
    selectedCountLabel?: ((count: number) => string) | undefined;
    /** Render an "Archive" bulk action that reports and clears. */
    onArchive?: ((selected: ReadonlySet<string>) => void) | undefined;
    columnMenu?: boolean;
    columnMenuLabel?: string | undefined;
    /** Bind `hiddenColumns` from this start, or leave it unbound when omitted. */
    initialHidden?: readonly string[] | undefined;
    /** Mark the last column `defaultHidden`. */
    defaultHidden?: boolean;
  }

  let {
    rows = allRows,
    sortable = true,
    caption,
    captionHidden = false,
    size,
    zebra = false,
    pinRows = false,
    class: className,
    emptyMessage,
    onSort,
    onSelect,
    withEmptyState = false,
    withFoot = false,
    rowHeader = false,
    headerClass,
    rowAttributes,
    selection,
    initialSelected = [],
    onSelectionChange,
    selectRowLabel,
    selectAllLabel,
    selectedCountLabel,
    onArchive,
    columnMenu = false,
    columnMenuLabel,
    initialHidden,
    defaultHidden = false,
  }: Props = $props();

  // Seeded once: the fixture owns the state from here, as a page would.
  // svelte-ignore state_referenced_locally
  let selected = $state(new Set(initialSelected));
  // svelte-ignore state_referenced_locally
  let hiddenColumns = $state(initialHidden === undefined ? undefined : new Set(initialHidden));

  const baseColumns = $derived(sortable ? columns : plainColumns);
  const shownColumns = $derived(
    baseColumns.map(
      (column, index): TableColumn<Row> =>
        Object.assign(
          {},
          column,
          rowHeader && index === 0 ? { rowHeader: true } : {},
          index === baseColumns.length - 1 ? { headerClass, defaultHidden } : {},
        ),
    ),
  );
</script>

{#snippet emptyState()}
  <span>Sow something.</span>
{/snippet}

{#snippet bulkActions({ selected: chosen, clear }: { selected: ReadonlySet<string>; clear: () => void })}
  <ToolbarButton
    onclick={() => {
      onArchive?.(chosen);
      clear();
    }}
  >
    Archive
  </ToolbarButton>
{/snippet}

{#snippet foot()}
  <td colspan="2">139 in total</td>
{/snippet}

<Table
  {rows}
  columns={shownColumns}
  {rowKey}
  {caption}
  {captionHidden}
  {size}
  {zebra}
  {pinRows}
  class={className}
  {emptyMessage}
  {onSort}
  {onSelect}
  {rowAttributes}
  emptyState={withEmptyState ? emptyState : undefined}
  foot={withFoot ? foot : undefined}
  {selection}
  {onSelectionChange}
  {selectRowLabel}
  {selectAllLabel}
  {selectedCountLabel}
  bulkActions={onArchive === undefined ? undefined : bulkActions}
  {columnMenu}
  {columnMenuLabel}
  bind:selected
  bind:hiddenColumns
/>

<p data-testid="selected">{[...selected].join(',')}</p>
<p data-testid="hidden">{hiddenColumns === undefined ? 'unbound' : [...hiddenColumns].join(',')}</p>
