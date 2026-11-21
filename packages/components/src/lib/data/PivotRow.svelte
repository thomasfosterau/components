<!--
  PivotRow — one `PivotTable` body row: its `th scope="row"` (a disclosure
  button for a parent group) and its data cells.
-->
<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import type { PivotBodyRow, PivotDataCell } from './pivot-layout.ts';

  interface Props {
    row: PivotBodyRow;
    label: string;
    /** Data columns, for an open parent's empty cell. */
    width: number;
    /** The cell's formatted value and raw number, or `undefined` for an empty cell. */
    value: (cell: PivotDataCell) => { text: string; amount: number } | undefined;
    ontoggle: () => void;
  }

  let { row, label, width, value, ontoggle }: Props = $props();
</script>

<tr class={row.group === undefined || row.parent ? 'font-semibold' : undefined}>
  <th id={row.id} scope="row" style:padding-inline-start="{0.75 + (row.group?.depth ?? 0) * 1.25}rem">
    {#if row.parent}
      <button
        type="button"
        class="inline-flex items-center gap-1"
        aria-expanded={row.expanded}
        onclick={ontoggle}
      >
        <ChevronRight
          class={['size-4 transition-transform', row.expanded && 'rotate-90']}
          aria-hidden="true"
        />{label}
      </button>
    {:else}
      {label}
    {/if}
  </th>
  {#each row.cells as cell (cell.headers)}
    {@const shown = value(cell)}
    <td headers={cell.headers} class="text-end tabular-nums">
      {#if shown}<data value={shown.amount}>{shown.text}</data>{/if}
    </td>
  {:else}
    <td colspan={width}></td>
  {/each}
</tr>
