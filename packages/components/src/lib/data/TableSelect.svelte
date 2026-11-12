<!-- @component
A table's selection control — the select-all box, or a row's box or radio; internal, not exported.
-->
<!--
  TableSelect — the native input `Table` and the editing `DataGrid`'s grid
  put in their selection column, so the two select identically. In the
  header (`header`) it is the tri-state select-all checkbox in
  `'multiple'` mode and the column's screen-reader-only name in
  `'single'`; in a row, a checkbox or a radio sharing `name`.

  ARIA contract: native inputs named by `label`; the checked state is the
  selection. The select-all box's mixed state is its `indeterminate`
  property. The caller's other attributes (a grid's `tabindex`) go on the
  input.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'checked' | 'indeterminate' | 'type'> {
    /** The header's control rather than a row's. */
    header: boolean;
    /** One row (a radio) or many (checkboxes). */
    selection: 'single' | 'multiple';
    /** The input's accessible name; in a `'single'` header, the column's hidden text. */
    label: string;
    /** Whether the row (or, in the header, the whole page) is selected. */
    checked: boolean;
    /** The header box's mixed state: some of the page is selected. */
    indeterminate?: boolean | undefined;
    /** Called with the new state when the reader toggles the input. */
    onToggle: (checked: boolean) => void;
  }

  let { header, selection, label, checked, indeterminate = false, onToggle, ...rest }: Props = $props();
</script>

{#if selection === 'single' && header}
  <span class="sr-only">{label}</span>
{:else if selection === 'single'}
  <input
    {...rest}
    type="radio"
    class="radio radio-sm"
    aria-label={label}
    {checked}
    onchange={() => {
      onToggle(true);
    }}
  />
{:else}
  <input
    {...rest}
    type="checkbox"
    class="checkbox checkbox-sm"
    aria-label={label}
    bind:checked={() => checked, onToggle}
    bind:indeterminate={
      () => indeterminate,
      () => {
        // The browser clears it on click; the derived state puts it back if due.
      }
    }
  />
{/if}
