<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import type { CascaderNode } from '../../lib/fields/cascader.ts';
  import Cascader from '../../lib/fields/Cascader.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Cascader',
    component: Cascader,
    parameters: {
      docs: {
        description: {
          component:
            'Pick a path through a hierarchy from cascading columns. → or Enter opens a branch, ← goes back, Enter on a leaf chooses it; children can load on demand and `searchable` finds a node at any depth. Below `sm` one column shows at a time, with a Back button.',
        },
      },
    },
  });

  const places: readonly CascaderNode[] = [
    {
      value: 'au',
      label: 'Australia',
      children: [
        {
          value: 'vic',
          label: 'Victoria',
          children: [
            { value: 'melbourne', label: 'Melbourne' },
            { value: 'geelong', label: 'Geelong' },
            { value: 'ballarat', label: 'Ballarat' },
          ],
        },
        {
          value: 'nsw',
          label: 'New South Wales',
          children: [
            { value: 'sydney', label: 'Sydney' },
            { value: 'newcastle', label: 'Newcastle' },
          ],
        },
        { value: 'tas', label: 'Tasmania', children: [{ value: 'hobart', label: 'Hobart' }] },
      ],
    },
    {
      value: 'nz',
      label: 'New Zealand',
      children: [
        { value: 'akl', label: 'Auckland', children: [{ value: 'akl-city', label: 'Auckland' }] },
        { value: 'wgn', label: 'Wellington', children: [{ value: 'wgn-city', label: 'Wellington' }] },
      ],
    },
    { value: 'other', label: 'Somewhere else' },
  ];

  const families: readonly CascaderNode[] = [
    { value: 'Solanaceae', label: 'Solanaceae', hasChildren: true },
    { value: 'Rosaceae', label: 'Rosaceae', hasChildren: true },
    { value: 'Brassicaceae', label: 'Brassicaceae', hasChildren: true },
  ];
  const below: Record<string, readonly string[]> = {
    Solanaceae: ['Solanum', 'Capsicum'],
    Rosaceae: ['Malus', 'Prunus', 'Rubus'],
    Brassicaceae: ['Brassica'],
    Solanum: ['Solanum lycopersicum', 'Solanum tuberosum', 'Solanum melongena'],
    Capsicum: ['Capsicum annuum', 'Capsicum chinense'],
    Malus: ['Malus domestica'],
    Prunus: ['Prunus avium', 'Prunus persica'],
    Rubus: ['Rubus idaeus'],
    Brassica: ['Brassica oleracea', 'Brassica rapa'],
  };

  /** A pretend fetch: genera have species below them, species are leaves. */
  const loadChildren = async (
    path: readonly string[],
    signal: AbortSignal,
  ): Promise<readonly CascaderNode[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    signal.throwIfAborted();
    const last = path.at(-1) ?? '';
    return (below[last] ?? []).map((child) => ({
      value: child,
      label: child,
      hasChildren: below[child] !== undefined,
    }));
  };
</script>

<Story name="Location">
  {#snippet template()}
    <div class="max-w-sm">
      <FormField label="Location" hint="→ opens a level, ← goes back, Enter chooses.">
        {#snippet children(control)}
          <Cascader {...control} options={places} value={['au', 'vic', 'geelong']} />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Taxonomy, lazily loaded">
  {#snippet template()}
    <div class="max-w-sm">
      <FormField label="Species" hint="Each level loads when it is opened.">
        {#snippet children(control)}
          <Cascader {...control} options={families} {loadChildren} />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Searchable">
  {#snippet template()}
    <div class="max-w-sm">
      <FormField label="Location" hint="Type to search every level.">
        {#snippet children(control)}
          <Cascader {...control} options={places} searchable />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Choose a parent">
  {#snippet template()}
    <div class="max-w-sm">
      <FormField label="Region" hint="Any level can be chosen.">
        {#snippet children(control)}
          <Cascader {...control} options={places} selectParents />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>
