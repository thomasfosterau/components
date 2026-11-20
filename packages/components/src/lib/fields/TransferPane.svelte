<!-- @component
One side of a `TransferList`: its heading, an optional filter field and a multiple `Listbox`. Internal.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { FieldOption, FieldSize } from './field-types.ts';
  import Listbox from './Listbox.svelte';

  interface Props {
    id: string;
    heading: string;
    options: readonly FieldOption[];
    /** The highlighted values. Bindable. */
    picked: string[];
    /** The filter text. Bindable. */
    filter: string;
    searchable: boolean;
    filterLabel: string;
    option: Snippet<[FieldOption, { selected: boolean }]> | undefined;
    rows: 4 | 6 | 8 | 10 | 12;
    size: FieldSize;
    disabled: boolean;
    invalid: boolean;
    required: boolean;
    emptyLabel: string;
    /** Rendered under the list. */
    footer?: Snippet<[]> | undefined;
  }

  let {
    id,
    heading,
    options,
    picked = $bindable(),
    filter = $bindable(),
    searchable,
    filterLabel,
    option,
    rows,
    size,
    disabled,
    invalid,
    required,
    emptyLabel,
    footer,
  }: Props = $props();
</script>

<div class="flex min-w-0 flex-col gap-2">
  <span id={`${id}-heading`} class="text-sm font-medium">{heading}</span>
  {#if searchable}
    <input
      type="search"
      class="input input-sm w-full"
      aria-label={filterLabel}
      aria-controls={id}
      {disabled}
      bind:value={filter}
    />
  {/if}
  <Listbox
    {id}
    {options}
    multiple
    bind:values={picked}
    labelId={`${id}-heading`}
    {...option === undefined ? {} : { option }}
    {rows}
    {size}
    {disabled}
    {invalid}
    {required}
    {emptyLabel}
  />
  {@render footer?.()}
</div>
