<!--
  PivotHead — `PivotTable`'s `<thead>`: the corner over the row headers,
  then a row per column dimension and one of measures, each `th` with the
  id its data cells name in `headers`.
-->
<script lang="ts">
  import type { PivotHeaderCell } from './pivot-layout.ts';

  interface Props {
    head: readonly (readonly PivotHeaderCell[])[];
    corner: string;
    text: (cell: PivotHeaderCell) => string;
  }

  let { head, corner, text }: Props = $props();
</script>

<thead>
  {#each head as cells, depth (depth)}
    <tr>
      {#if depth === 0}
        <th scope="col" rowspan={head.length} class="align-bottom">{corner}</th>
      {/if}
      {#each cells as cell (cell.id)}
        <th
          id={cell.id}
          scope={cell.colSpan > 1 ? 'colgroup' : 'col'}
          colspan={cell.colSpan}
          rowspan={cell.rowSpan}
          class={cell.kind === 'value' ? 'text-end' : 'text-center'}
        >
          {text(cell)}
        </th>
      {/each}
    </tr>
  {/each}
</thead>
