<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Combobox from '../../lib/fields/Combobox.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Combobox',
    component: Combobox,
    parameters: {
      docs: {
        description: {
          component:
            'A single-select typeahead over a static list OR an asynchronous search, on bits-ui’s `Combobox`. bits-ui owns the listbox ARIA, the roving cursor and the outside-click handling; this component owns the search lifecycle — debounce, latest-wins via `AbortController`, and stale-while-revalidate so the previous results stay on screen while the next request is in flight. Enter with nothing highlighted deliberately lets a wrapping `<form>` submit. `postedValue="query"` turns it into a search box: the input itself posts the typed text under `name` (so a GET form works with JavaScript off), and Enter submits unless the reader arrowed to a suggestion.',
        },
      },
    },
  });

  interface Taxon {
    readonly id: string;
    readonly name: string;
    readonly rank: string;
  }

  const TAXA: readonly Taxon[] = [
    { id: 'rosa-canina', name: 'Rosa canina', rank: 'species' },
    { id: 'rosa-rugosa', name: 'Rosa rugosa', rank: 'species' },
    { id: 'rosa', name: 'Rosa', rank: 'genus' },
    { id: 'rosaceae', name: 'Rosaceae', rank: 'family' },
    { id: 'rubus-fruticosus', name: 'Rubus fruticosus', rank: 'species' },
    { id: 'prunus-avium', name: 'Prunus avium', rank: 'species' },
  ];

  const taxonId = (taxon: Taxon) => taxon.id;
  const taxonLabel = (taxon: Taxon) => taxon.name;
  const taxonBadge = (taxon: Taxon) => taxon.rank;

  /** Stands in for a network call: 400 ms, and honours the abort signal. */
  const searchTaxa = (query: string, signal: AbortSignal): Promise<readonly Taxon[]> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(TAXA.filter((taxon) => taxon.name.toLowerCase().includes(query.toLowerCase())));
      }, 400);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason as Error);
      });
    });
</script>

<script lang="ts">
  let staticValue = $state<string | undefined>('rosa-canina');
  let asyncValue = $state<string | undefined>();
  let searchQuery = $state('rosa');
  let picked = $state<string | undefined>();
</script>

<Story name="Static list">
  <div class="max-w-sm">
    <Combobox
      label="Taxon"
      placeholder="Start typing a name"
      items={TAXA}
      getId={taxonId}
      getLabel={taxonLabel}
      getBadge={taxonBadge}
      name="taxonId"
      bind:value={staticValue}
    />
    <p class="text-base-content/70 mt-3 text-sm">Selected: {staticValue ?? 'nothing'}</p>
  </div>
</Story>

<Story name="Asynchronous search">
  <div class="max-w-sm">
    <Combobox
      label="Taxon"
      placeholder="Start typing a name"
      onSearch={searchTaxa}
      getId={taxonId}
      getLabel={taxonLabel}
      getBadge={taxonBadge}
      pendingLabel="Searching the index…"
      emptyLabel="No taxon matches that."
      bind:value={asyncValue}
    />
    <p class="text-base-content/70 mt-3 text-sm">Selected: {asyncValue ?? 'nothing'}</p>
  </div>
</Story>

<Story name="Custom rows, empty state and footer">
  <div class="max-w-sm">
    <Combobox
      label="Taxon"
      placeholder="Start typing a name"
      items={TAXA}
      getId={taxonId}
      getLabel={taxonLabel}
    >
      {#snippet item(taxon)}
        <span class="flex flex-col text-left">
          <span class="font-medium italic">{taxon.name}</span>
          <span class="fieldset-label">{taxon.rank}</span>
        </span>
      {/snippet}
      {#snippet empty({ query })}
        <p class="fieldset-label px-3 py-2">Nothing here matches “{query}”.</p>
      {/snippet}
      {#snippet footer({ query, pending })}
        <p class="fieldset-label border-base-300 mt-1 border-t px-3 pt-2">
          {pending ? 'Still looking…' : `Press Enter to search for “${query}” instead.`}
        </p>
      {/snippet}
    </Combobox>
  </div>
</Story>

<Story name="Invalid, with an error">
  <div class="max-w-sm">
    <Combobox
      label="Taxon"
      placeholder="Start typing a name"
      items={TAXA}
      getId={taxonId}
      getLabel={taxonLabel}
      invalid
      required
      errorMessage="The index could not be reached."
    />
  </div>
</Story>

<Story name="Search box (posts the typed query)">
  <form
    method="GET"
    action="#search"
    class="join max-w-md"
    onsubmit={(event) => event.preventDefault()}
  >
    <Combobox
      label="Search"
      hideLabel
      placeholder="Search taxa"
      name="query"
      postedValue="query"
      initialQuery="rosa"
      onSearch={searchTaxa}
      getId={taxonId}
      getLabel={taxonLabel}
      getBadge={taxonBadge}
      inputClass="join-item"
      class="p-0"
      onQueryChange={(next) => (searchQuery = next)}
      onSelect={(taxon) => (picked = taxon.name)}
    >
      {#snippet footer({ query })}
        <p class="fieldset-label border-base-300 mt-1 border-t px-3 pt-2">
          Press Enter to see every result for “{query}”.
        </p>
      {/snippet}
    </Combobox>
    <button type="submit" class="btn btn-primary join-item">Search</button>
  </form>
  <p class="text-base-content/70 mt-3 text-sm">
    Query: “{searchQuery}” · Picked: {picked ?? 'nothing'}
  </p>
</Story>
