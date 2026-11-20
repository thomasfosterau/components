<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import type { TreeNode } from '../../lib/data/tree-view.ts';
  import FormField from '../../lib/fields/FormField.svelte';
  import TreeSelect from '../../lib/fields/TreeSelect.svelte';

  const { Story } = defineMeta({
    title: 'Fields/TreeSelect',
    component: TreeSelect,
    parameters: {
      docs: {
        description: {
          component:
            'A select-like field whose popover is a searchable tree. Pick one node, or with `multiple` check many: checking a parent checks its leaves, and a partly checked parent shows the mixed state. `strategy` decides what a whole checked subtree reports.',
        },
      },
    },
  });

  const garden: readonly TreeNode[] = [
    {
      id: 'north',
      label: 'North garden',
      children: [
        { id: 'north-1', label: 'Bed 1' },
        { id: 'north-2', label: 'Bed 2' },
        { id: 'north-3', label: 'Bed 3' },
      ],
    },
    {
      id: 'south',
      label: 'South garden',
      children: [
        { id: 'glasshouse', label: 'Glasshouse', children: [{ id: 'bench-1', label: 'Bench 1' }, { id: 'bench-2', label: 'Bench 2' }] },
        { id: 'south-4', label: 'Bed 4' },
        { id: 'south-5', label: 'Bed 5 (fallow)', disabled: true },
      ],
    },
  ];

  const large: readonly TreeNode[] = Array.from({ length: 12 }, (_, zone) => ({
    id: `zone-${zone + 1}`,
    label: `Zone ${zone + 1}`,
    children: Array.from({ length: 20 }, (_bed, bed) => ({
      id: `zone-${zone + 1}-bed-${bed + 1}`,
      label: `Zone ${zone + 1} · Bed ${bed + 1}`,
    })),
  }));
</script>

<Story name="Single leaf" asChild>
  <div class="max-w-sm">
    <FormField label="Plant in" hint="Choose a bed; gardens only group them.">
      {#snippet children(control)}
        <TreeSelect {...control} nodes={garden} leavesOnly />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Multiple, by parent" asChild>
  <div class="max-w-sm">
    <FormField label="Notify me about">
      {#snippet children(control)}
        <TreeSelect {...control} nodes={garden} multiple values={['north', 'bench-1']} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Multiple, by leaf" asChild>
  <div class="max-w-sm">
    <FormField label="Water these beds" hint="A whole garden reports each of its beds.">
      {#snippet children(control)}
        <TreeSelect {...control} nodes={garden} multiple strategy="leaf" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Large tree with search" asChild>
  <div class="max-w-sm">
    <FormField label="Beds">
      {#snippet children(control)}
        <TreeSelect {...control} nodes={large} multiple />
      {/snippet}
    </FormField>
  </div>
</Story>
