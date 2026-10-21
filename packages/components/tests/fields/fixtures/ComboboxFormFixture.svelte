<script lang="ts">
  import Combobox from '../../../src/lib/fields/Combobox.svelte';

  export interface Taxon {
    readonly id: string;
    readonly name: string;
    readonly rank?: string | undefined;
  }

  interface Props {
    items?: readonly Taxon[] | undefined;
    onSearch?: ((query: string, signal: AbortSignal) => Promise<readonly Taxon[]>) | undefined;
    value?: string | undefined;
    /** Called when the wrapping form actually submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
    debounceMs?: number | undefined;
    emptyLabel?: string | undefined;
    pendingLabel?: string | undefined;
    name?: string | undefined;
    postedValue?: 'id' | 'query' | undefined;
    initialQuery?: string | undefined;
    onQueryChange?: ((query: string) => void) | undefined;
    onSelect?: ((item: Taxon) => void) | undefined;
    inputClass?: string | undefined;
    hideLabel?: boolean | undefined;
    portal?: boolean | undefined;
    testId?: string | undefined;
  }

  let {
    items,
    onSearch,
    value = $bindable(),
    onSubmitted,
    debounceMs,
    emptyLabel,
    pendingLabel,
    name = 'taxonId',
    postedValue,
    initialQuery,
    onQueryChange,
    onSelect,
    inputClass,
    hideLabel,
    portal,
    testId,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <Combobox
    label="Taxon"
    placeholder="Start typing"
    {name}
    {postedValue}
    {initialQuery}
    {onQueryChange}
    {onSelect}
    {inputClass}
    {hideLabel}
    {portal}
    data-testid={testId}
    {items}
    {onSearch}
    {debounceMs}
    {emptyLabel}
    {pendingLabel}
    bind:value
    getId={(taxon) => taxon.id}
    getLabel={(taxon) => taxon.name}
    getBadge={(taxon) => taxon.rank}
  />
  <button type="submit">Search</button>
</form>
<p data-testid="selected">{value ?? 'none'}</p>
