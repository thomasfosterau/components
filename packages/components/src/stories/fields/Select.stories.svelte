<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import Select from '../../lib/fields/Select.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Select',
    component: Select,
    parameters: {
      docs: {
        description: {
          component:
            'A native `<select>`, deliberately: it is keyboard- and typeahead-complete with no script, and on a phone it opens the platform picker. `Combobox` is the rich alternative for lists too long to scroll or lists that must be fetched.',
        },
      },
    },
  });

  const ranks = [
    { value: 'family', label: 'Family' },
    { value: 'genus', label: 'Genus' },
    { value: 'species', label: 'Species' },
    { value: 'cultivar', label: 'Cultivar', disabled: true },
  ];
</script>

<Story name="With a placeholder">
  <div class="max-w-sm">
    <FormField label="Rank" hint="Cultivars are added from the taxon page.">
      {#snippet children(control)}
        <Select {...control} options={ranks} placeholder="Choose a rank" value="" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Bare strings">
  <div class="max-w-sm">
    <FormField label="Bed">
      {#snippet children(control)}
        <Select {...control} options={['North', 'South', 'Glasshouse']} value="South" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Invalid">
  <div class="max-w-sm">
    <FormField label="Rank" errors={['Choose a rank.']}>
      {#snippet children(control)}
        <Select {...control} options={ranks} placeholder="Choose a rank" value="" />
      {/snippet}
    </FormField>
  </div>
</Story>
