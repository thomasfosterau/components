<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import JsonView from '../../lib/data/JsonView.svelte';

  const { Story } = defineMeta({
    title: 'Data/JsonView',
    component: JsonView,
    parameters: {
      docs: {
        description: {
          component:
            'A read-only tree of structured data on `TreeView`: arrow keys move and expand, typeahead jumps by key, Ctrl/⌘+C copies the focused value, and the filter keeps matches with their ancestors.',
        },
      },
    },
  });

  const response = {
    id: 'g-204',
    name: 'Allotment 4',
    area: 12.5,
    organic: true,
    archivedAt: null,
    beds: [
      { name: 'Tomato', plants: 6, sown: '2026-09-12' },
      { name: 'Broad bean', plants: 24, sown: '2026-05-02' },
      { name: 'Garlic', plants: 40, sown: '2026-04-20' },
    ],
    links: { self: 'https://example.org/gardens/g-204' },
  };

  const feature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [151.2093, -33.8688] },
    properties: { name: 'Community garden', beds: 18, irrigated: false },
  };

  const large = {
    rows: Array.from({ length: 500 }, (_, index) => ({
      line: index + 1,
      taxon: `Taxon ${index + 1}`,
      notes: index === 0 ? 'Observed along the creek. '.repeat(30) : '',
    })),
  };
</script>

<Story name="API response">
  {#snippet template()}
    <JsonView value={response} label="Response" expandDepth={2} />
  {/snippet}
</Story>

<Story name="GeoJSON feature">
  {#snippet template()}
    <JsonView value={feature} label="Feature" hideRoot expandDepth={2} />
  {/snippet}
</Story>

<Story name="Large payload">
  {#snippet template()}
    <JsonView value={large} label="Import" />
  {/snippet}
</Story>

<Story name="Dates drawn as dates">
  {#snippet template()}
    <JsonView value={response} label="Response" expandDepth={3}>
      {#snippet renderValue({ value })}
        {#if typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)}
          <time datetime={value}>
            {new Date(value).toLocaleDateString('en-AU', { dateStyle: 'medium' })}
          </time>
        {:else}
          {JSON.stringify(value)}
        {/if}
      {/snippet}
    </JsonView>
  {/snippet}
</Story>
