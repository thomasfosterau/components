<!--
  A generic component cannot be rendered straight from a `.ts` test:
  `ComponentProps<typeof Table>` resolves `T` to `unknown`, so the fixture
  data's own `TableColumn<Row>[]` will not assign. This fixture pins `T` to
  `Row` once, and takes the props each test varies.
-->
<script lang="ts">
  import Table from '../../../src/lib/data/Table.svelte';
  import type { SortState } from '../../../src/lib/data/table-types.ts';
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
  }: Props = $props();
</script>

{#snippet emptyState()}
  <span>Sow something.</span>
{/snippet}

{#snippet foot()}
  <td colspan="2">139 in total</td>
{/snippet}

<Table
  {rows}
  columns={sortable ? columns : plainColumns}
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
  emptyState={withEmptyState ? emptyState : undefined}
  foot={withFoot ? foot : undefined}
/>
