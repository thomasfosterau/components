<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { TreeNode } from '../../../src/lib/data/tree-view.ts';
  import TreeSelect from '../../../src/lib/fields/TreeSelect.svelte';

  type Props = Omit<ComponentProps<typeof TreeSelect>, 'nodes'>;

  let { value = $bindable(), values = $bindable([]), ...rest }: Props = $props();

  const nodes: readonly TreeNode[] = [
    {
      id: 'zone-a',
      label: 'Zone A',
      children: [
        { id: 'bed-1', label: 'Bed 1' },
        { id: 'bed-2', label: 'Bed 2' },
        { id: 'bed-3', label: 'Bed 3' },
      ],
    },
    { id: 'zone-b', label: 'Zone B', children: [{ id: 'bed-4', label: 'Bed 4' }] },
  ];
</script>

<form data-testid="form">
  <TreeSelect {...rest} {nodes} bind:value bind:values name="beds" aria-label="Beds" />
</form>
<output data-testid="value">{value ?? ''}</output>
<output data-testid="values">{values.join(',')}</output>
