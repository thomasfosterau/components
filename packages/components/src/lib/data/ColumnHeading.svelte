<!-- @component
A column header's content: the sort button when the column sorts, else its text; internal, not exported.
-->
<!--
  ColumnHeading — what `Table` and the editing `DataGrid`'s grid put in a
  `<th scope="col">`: the header text, inside a `<button>` when the column
  sorts. ARIA contract: a real button named by `label` (the activation);
  the arrow beside the header text is `aria-hidden`, because the `<th>`'s
  `aria-sort` is the state. The caller's other attributes (a grid's
  `tabindex`) go on the button.
-->
<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLButtonAttributes, 'children' | 'type'> {
    /** The header text. */
    header: string;
    /** Whether the column sorts; plain text when it does not. */
    sortable: boolean;
    /** The button's accessible name. */
    label: string;
    /** The decorative arrow: `'▲'`, `'▼'` or `''`. */
    indicator: string;
  }

  let { header, sortable, label, indicator, ...rest }: Props = $props();
</script>

{#if sortable}
  <button {...rest} type="button" class="link link-hover inline-flex items-center gap-1" aria-label={label}>
    {header}
    <span aria-hidden="true" class="text-xs">{indicator}</span>
  </button>
{:else}
  {header}
{/if}
