<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LinkListItem from '../../lib/data/LinkListItem.svelte';
  import VirtualList from '../../lib/data/VirtualList.svelte';
  import InfiniteVirtualList from './InfiniteVirtualList.svelte';

  interface Taxon {
    readonly id: number;
    readonly name: string;
    readonly notes: string;
  }

  const names = ['Eucalyptus', 'Acacia', 'Banksia', 'Grevillea', 'Callistemon', 'Melaleuca'];
  const notes = [
    'Common.',
    'Recorded in every bioregion; flowers late winter to spring.',
    'Locally abundant on sandy heath, rare inland. Several subspecies are listed as vulnerable, and two are known only from a handful of populations in the south-west.',
  ];

  /** 10,000 rows: the case windowing exists for. */
  const taxa: readonly Taxon[] = Array.from({ length: 10_000 }, (_, index) => ({
    id: index,
    name: `${names[index % names.length] ?? ''} sp. ${index + 1}`,
    notes: notes[index % notes.length] ?? '',
  }));

  const { Story } = defineMeta({
    title: 'Data/VirtualList',
    component: VirtualList,
    parameters: {
      docs: {
        description: {
          component:
            'Mounts only the rows in or near the viewport. Every rendered row carries `aria-posinset` / `aria-setsize`, the spacers are `aria-hidden`, and the focused row stays mounted until focus leaves it. Find-in-page cannot reach unrendered rows: for a few hundred rows, prefer `ItemList` with `lazyRender`.',
        },
      },
    },
  });
</script>

{#snippet taxonRow(taxon: Taxon)}
  <LinkListItem
    href="/taxa/{taxon.id}"
    title={taxon.name}
    class="border-base-300 h-full border-b px-4 py-2"
  />
{/snippet}

{#snippet measuredRow(taxon: Taxon)}
  <div class="border-base-300 border-b px-4 py-3">
    <a class="link font-medium" href="/taxa/{taxon.id}">{taxon.name}</a>
    <p class="text-base-content/70 text-sm">{taxon.notes}</p>
  </div>
{/snippet}

<Story name="Fixed rows, 10,000">
  <!-- Open the a11y tree: ~30 rows in the DOM, each "n of 10000". -->
  <VirtualList
    items={taxa}
    key={(taxon) => taxon.id}
    row={taxonRow}
    estimateSize={64}
    label="Taxa"
    class="border-base-300 h-96 rounded-box border"
  />
</Story>

<Story name="Measured rows">
  <VirtualList
    items={taxa}
    key={(taxon) => taxon.id}
    row={measuredRow}
    measure
    estimateSize={72}
    label="Taxa"
    class="border-base-300 h-96 rounded-box border"
  />
</Story>

<Story name="Window scroller">
  <!-- The page scrolls; the list has no height of its own. -->
  <VirtualList
    items={taxa}
    key={(taxon) => taxon.id}
    row={taxonRow}
    estimateSize={64}
    scroller="window"
    label="Taxa"
  />
</Story>

<Story name="Infinite load">
  <InfiniteVirtualList total={500} />
</Story>

<Story name="Feed">
  <!-- Focus a link, then Page Down / Page Up move between articles,
       scrolling the next one into existence when it is outside the window. -->
  <VirtualList
    items={taxa}
    key={(taxon) => taxon.id}
    row={measuredRow}
    measure
    estimateSize={72}
    semantics="feed"
    label="Recent records"
    class="border-base-300 h-96 rounded-box border"
  />
</Story>
