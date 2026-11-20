<!-- A Cascader inside a FormField and a form, with the path bound, so a test
     can read the value and what the form posts. -->
<script lang="ts">
  import type { CascaderNode } from '../../../src/lib/fields/cascader.ts';
  import Cascader from '../../../src/lib/fields/Cascader.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';

  interface Props {
    value?: string[] | undefined;
    options?: readonly CascaderNode[] | undefined;
    loadChildren?:
      | ((path: readonly string[], signal: AbortSignal) => Promise<readonly CascaderNode[]>)
      | undefined;
    selectParents?: boolean | undefined;
    searchable?: boolean | undefined;
    search?:
      | ((query: string, signal: AbortSignal) => Promise<readonly (readonly CascaderNode[])[]>)
      | undefined;
    pathSeparator?: string | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  const taxonomy: readonly CascaderNode[] = [
    {
      value: 'Plantae',
      label: 'Plantae',
      children: [
        {
          value: 'Solanaceae',
          label: 'Solanaceae',
          children: [
            { value: 'Solanum lycopersicum', label: 'Solanum lycopersicum' },
            { value: 'Solanum tuberosum', label: 'Solanum tuberosum' },
          ],
        },
        {
          value: 'Rosaceae',
          label: 'Rosaceae',
          children: [{ value: 'Malus domestica', label: 'Malus domestica' }],
        },
      ],
    },
    { value: 'Fungi', label: 'Fungi', disabled: true, children: [] },
    { value: 'Unsorted', label: 'Unsorted' },
  ];

  let {
    value = $bindable([]),
    options = taxonomy,
    loadChildren,
    selectParents,
    searchable,
    search,
    pathSeparator,
    onSubmitted,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Species" hint="Drill down to a species.">
    {#snippet children(control)}
      <Cascader
        {...control}
        {options}
        {loadChildren}
        {selectParents}
        {searchable}
        {search}
        {pathSeparator}
        name="species"
        bind:value
      />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{value.join('|')}</p>
