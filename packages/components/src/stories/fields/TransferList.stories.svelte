<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import TransferList from '../../lib/fields/TransferList.svelte';

  const { Story } = defineMeta({
    title: 'Fields/TransferList',
    component: TransferList,
    parameters: {
      docs: {
        description: {
          component:
            'Two listboxes, available and chosen. Highlight options and use the buttons, Enter or a double-click to move them; `orderable` adds Move up/down and Alt+↑/↓ on the chosen list, `searchable` a filter above each.',
        },
      },
    },
  });

  const columns = [
    'Plot',
    'Bed',
    'Crop',
    'Variety',
    'Sown',
    'Planted out',
    'First harvest',
    { value: 'Yield', label: 'Yield (needs a harvest log)', disabled: true },
    'Notes',
  ];
</script>

<Story name="Default">
  {#snippet template()}
    <div class="max-w-2xl">
      <FormField label="Export columns" hint="Highlight columns, then add or remove them.">
        {#snippet children(control)}
          <TransferList {...control} options={columns} value={['Plot', 'Crop']} rows={6} />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Orderable and searchable">
  {#snippet template()}
    <div class="max-w-2xl">
      <FormField label="Export columns" hint="Alt+↑/↓ reorders the chosen columns.">
        {#snippet children(control)}
          <TransferList
            {...control}
            options={columns}
            value={['Crop', 'Plot', 'Sown']}
            orderable
            searchable
            rows={6}
          />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="max-w-2xl">
      <FormField label="Export columns">
        {#snippet children(control)}
          <TransferList {...control} options={columns} value={['Plot']} disabled rows={4} />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>
