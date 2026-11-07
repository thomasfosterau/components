<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import Listbox from '../../lib/fields/Listbox.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Listbox',
    component: Listbox,
    parameters: {
      docs: {
        description: {
          component:
            'An always-visible list to choose one or several from: the APG listbox, one tab stop, `aria-activedescendant` focus, typeahead, and in multiple mode Space, Shift ranges and Ctrl/⌘+A. Use it where a `CheckboxGroup` would be dozens of tab stops and a `Select` would hide the options.',
        },
      },
    },
  });

  const beds = ['Raised bed', 'Container', 'Rockery', 'Pond margin', 'Hedge line', 'Orchard'];
  const crops = [
    { value: 'tomato', label: 'Tomato', group: 'Fruit' },
    { value: 'chilli', label: 'Chilli', group: 'Fruit' },
    { value: 'squash', label: 'Squash', group: 'Fruit' },
    { value: 'kale', label: 'Kale', group: 'Leaves' },
    { value: 'chard', label: 'Chard', group: 'Leaves' },
    { value: 'garlic', label: 'Garlic', group: 'Roots and bulbs' },
    { value: 'beetroot', label: 'Beetroot', group: 'Roots and bulbs', disabled: true },
  ];
  const templates = [
    { value: 'kitchen', label: 'Kitchen garden' },
    { value: 'cottage', label: 'Cottage border' },
    { value: 'dry', label: 'Dry garden' },
  ];
  const descriptions: Record<string, string> = {
    kitchen: 'Vegetables and herbs in rotating beds.',
    cottage: 'Dense perennials, self-seeding annuals.',
    dry: 'Gravel, drought-tolerant planting, no irrigation.',
  };
  const many = Array.from({ length: 120 }, (_, index) => `Plot ${String(index + 1).padStart(3, '0')}`);
</script>

<Story name="Single">
  <div class="max-w-sm">
    <FormField label="Bed type" hint="Arrow keys move and select; type to jump.">
      {#snippet children(control)}
        <Listbox {...control} options={beds} value="Rockery" rows={6} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Multiple">
  <div class="max-w-sm">
    <FormField label="Crops to export" hint="Space toggles; Shift extends; Ctrl/⌘+A selects all.">
      {#snippet children(control)}
        <Listbox {...control} options={crops} multiple values={['tomato', 'kale']} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Rich options">
  <div class="max-w-sm">
    <FormField label="Template">
      {#snippet children(control)}
        <Listbox {...control} options={templates} value="cottage" rows={4}>
          {#snippet option(entry)}
            <span class="block">{entry.label}</span>
            <span class="text-base-content/60 block text-sm">{descriptions[entry.value]}</span>
          {/snippet}
        </Listbox>
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Toggle model, long list">
  <!-- Touch-first: a click toggles, no modifiers. 120 options in a 10-row box. -->
  <div class="max-w-sm">
    <FormField label="Plots">
      {#snippet children(control)}
        <Listbox {...control} options={many} multiple selectionModel="toggle" rows={10} />
      {/snippet}
    </FormField>
  </div>
</Story>
