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
    /** Called when the wrapping form actually submits. */
    onSubmitted?: (() => void) | undefined;
    debounceMs?: number | undefined;
    emptyLabel?: string | undefined;
    pendingLabel?: string | undefined;
  }

  let {
    items,
    onSearch,
    value = $bindable(),
    onSubmitted,
    debounceMs,
    emptyLabel,
    pendingLabel,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.();
  }}
>
  <Combobox
    label="Taxon"
    placeholder="Start typing"
    name="taxonId"
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
