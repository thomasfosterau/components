<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { SvelteSet } from 'svelte/reactivity';
  import TreeView from '../../lib/data/TreeView.svelte';
  import type { TreeNode, TreeRowState } from '../../lib/data/tree-view.ts';
  import Badge from '../../lib/ui/Badge.svelte';

  interface Taxon {
    readonly rank: 'family' | 'genus' | 'species';
  }

  const taxa: readonly TreeNode<Taxon>[] = [
    {
      id: 'rosaceae',
      label: 'Rosaceae',
      data: { rank: 'family' },
      children: [
        {
          id: 'rosa',
          label: 'Rosa',
          data: { rank: 'genus' },
          children: [
            { id: 'rosa-canina', label: 'Rosa canina', data: { rank: 'species' } },
            { id: 'rosa-rugosa', label: 'Rosa rugosa', data: { rank: 'species' } },
          ],
        },
        {
          id: 'malus',
          label: 'Malus',
          data: { rank: 'genus' },
          children: [{ id: 'malus-domestica', label: 'Malus domestica', data: { rank: 'species' } }],
        },
        {
          id: 'fragaria',
          label: 'Fragaria',
          data: { rank: 'genus' },
          children: [{ id: 'fragaria-vesca', label: 'Fragaria vesca', data: { rank: 'species' } }],
        },
      ],
    },
    {
      id: 'amaryllidaceae',
      label: 'Amaryllidaceae',
      data: { rank: 'family' },
      children: [
        {
          id: 'allium',
          label: 'Allium',
          data: { rank: 'genus' },
          children: [
            { id: 'allium-cepa', label: 'Allium cepa', data: { rank: 'species' } },
            { id: 'allium-sativum', label: 'Allium sativum', data: { rank: 'species' } },
          ],
        },
      ],
    },
    { id: 'unplaced', label: 'Unplaced specimens', disabled: true },
  ];

  /** Families whose genera arrive on first expand. */
  const lazyFamilies: readonly TreeNode[] = [
    { id: 'lamiaceae', label: 'Lamiaceae', children: [] },
    { id: 'solanaceae', label: 'Solanaceae', children: [] },
  ];

  const genera: Readonly<Record<string, readonly string[]>> = {
    lamiaceae: ['Mentha', 'Ocimum', 'Salvia', 'Thymus'],
    solanaceae: ['Capsicum', 'Solanum'],
  };

  /** Stands in for a fetch: resolves after 800 ms, and honours the signal. */
  function loadGenera(node: TreeNode, signal: AbortSignal): Promise<readonly TreeNode[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve((genera[node.id] ?? []).map((name) => ({ id: `${node.id}/${name}`, label: name })));
      }, 800);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
  }

  const { Story } = defineMeta({
    title: 'Data/TreeView',
    component: TreeView,
    parameters: {
      docs: {
        description: {
          component:
            'An APG `tree` widget for a hierarchy the reader selects from: one Tab stop, arrow keys to move and expand, typeahead, `*` to expand siblings, and single or multiple selection bound as a `SvelteSet` of ids. For a hierarchy that is only read, use `TreeList`.',
        },
      },
    },
  });
</script>

<script lang="ts">
  const singleSelected = new SvelteSet<string>(['malus']);
  const singleExpanded = new SvelteSet<string>(['rosaceae']);
  const multipleSelected = new SvelteSet<string>();
</script>

{#snippet taxonRow(node: TreeNode<Taxon>, state: TreeRowState)}
  <span class={[node.data?.rank === 'species' && 'italic']}>{node.label}</span>
  {#if node.data !== undefined && !state.selected}
    <Badge size="xs" class="ms-auto">{node.data.rank}</Badge>
  {/if}
{/snippet}

<Story name="Single selection">
  <TreeView
    nodes={taxa}
    label="Taxa"
    expanded={singleExpanded}
    selected={singleSelected}
    class="max-w-sm"
  />
  <p class="mt-4 text-sm">Selected: {[...singleSelected].join(', ') || 'nothing'}</p>
</Story>

<Story name="Multiple selection">
  <TreeView
    nodes={taxa}
    label="Taxa to compare"
    selection="multiple"
    selected={multipleSelected}
    class="max-w-sm"
  />
  <p class="mt-4 text-sm">Selected: {[...multipleSelected].join(', ') || 'nothing'}</p>
</Story>

<Story name="Custom row">
  <TreeView nodes={taxa} label="Taxa" row={taxonRow} class="max-w-sm" />
</Story>

<Story name="Lazy children">
  <TreeView
    nodes={lazyFamilies}
    label="Families"
    loadChildren={loadGenera}
    selection="none"
    class="max-w-sm"
  />
</Story>
