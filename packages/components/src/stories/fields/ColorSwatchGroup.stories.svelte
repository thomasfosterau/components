<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ColorSwatchGroup from '../../lib/fields/ColorSwatchGroup.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/ColorSwatchGroup',
    component: ColorSwatchGroup,
    parameters: {
      docs: {
        description: {
          component:
            'One colour from a palette, on bits-ui’s `RadioGroup`: one Tab stop, arrows move and select. Each swatch is named by its label, and the check is drawn in whichever of black or white contrasts more.',
        },
      },
    },
  });

  const tagColours = [
    { value: '#3a7d44', label: 'Moss green' },
    { value: '#8fbc5a', label: 'Leaf green' },
    { value: '#ffeb3b', label: 'Sunflower' },
    { value: '#f28c28', label: 'Pumpkin' },
    { value: '#c0392b', label: 'Tomato red' },
    { value: '#8e44ad', label: 'Aubergine' },
    { value: '#1e3a5f', label: 'Night blue' },
    { value: '#f5f5f0', label: 'Chalk' },
  ];
</script>

<Story name="Standalone">
  {#snippet template()}
    <ColorSwatchGroup label="Tag colour" swatches={tagColours} value="#ffeb3b" />
  {/snippet}
</Story>

<Story name="In a FormField">
  {#snippet template()}
    <FormField label="Tag colour" hint="Shown on every planting with this tag.">
      {#snippet children(control)}
        <ColorSwatchGroup {...control} name="colour" swatches={tagColours} value="#3a7d44" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Sizes">
  {#snippet template()}
    <div class="flex flex-col gap-3">
      {#each ['xs', 'sm', 'md', 'lg'] as const as size (size)}
        <ColorSwatchGroup label="Tag colour, {size}" {size} swatches={tagColours} value="#c0392b" />
      {/each}
    </div>
  {/snippet}
</Story>
