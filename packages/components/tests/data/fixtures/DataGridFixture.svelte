<!-- `DataGrid` is generic too; see `TableFixture.svelte` for why that needs a
     fixture rather than a direct render. -->
<script lang="ts">
  import DataGrid from '../../../src/lib/data/DataGrid.svelte';
  import { columns, rowKey, rows as allRows, type Row } from './table-data.ts';

  interface Props {
    rows?: readonly Row[];
    filterable?: boolean;
    paginated?: boolean;
    pageSize?: number;
    pageSizeOptions?: readonly number[];
    emptyMessage?: string | undefined;
    filterLabel?: string | undefined;
    rowsPerPageLabel?: string | undefined;
    showingLabel?: ((start: number, end: number, total: number) => string) | undefined;
    pageOfLabel?: ((page: number, pages: number) => string) | undefined;
    previousLabel?: string | undefined;
    nextLabel?: string | undefined;
    paginationLabel?: string | undefined;
  }

  let {
    rows = allRows,
    filterable = false,
    paginated = true,
    pageSize,
    pageSizeOptions,
    emptyMessage,
    filterLabel,
    rowsPerPageLabel,
    showingLabel,
    pageOfLabel,
    previousLabel,
    nextLabel,
    paginationLabel,
  }: Props = $props();
</script>

<DataGrid
  {rows}
  {columns}
  {rowKey}
  {filterable}
  {paginated}
  {pageSize}
  {pageSizeOptions}
  {emptyMessage}
  {filterLabel}
  {rowsPerPageLabel}
  {showingLabel}
  {pageOfLabel}
  {previousLabel}
  {nextLabel}
  {paginationLabel}
/>
