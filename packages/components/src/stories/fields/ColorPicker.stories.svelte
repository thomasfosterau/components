<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ColorPicker from '../../lib/fields/ColorPicker.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/ColorPicker',
    component: ColorPicker,
    parameters: {
      docs: {
        description: {
          component:
            'A colour from a popover of swatches and a custom HSV editor, from `@thomasfosterau/components/color-picker`. The square takes the arrow keys (Shift for ten), the strips are sliders, the hex field commits on Enter or blur, and the eyedropper shows where the browser supports it.',
        },
      },
    },
  });

  const bedColours = [
    { value: '#3a7d44', label: 'Moss green' },
    { value: '#8fbc5a', label: 'Leaf green' },
    { value: '#ffeb3b', label: 'Sunflower' },
    { value: '#f28c28', label: 'Pumpkin' },
    { value: '#c0392b', label: 'Tomato red' },
    { value: '#1e3a5f', label: 'Night blue' },
  ];
</script>

<Story name="Swatches only">
  {#snippet template()}
    <ColorPicker swatches={bedColours} allowCustom={false} value="#f28c28" />
  {/snippet}
</Story>

<Story name="Swatches and custom">
  {#snippet template()}
    <ColorPicker swatches={bedColours} value="#3a7d44" />
  {/snippet}
</Story>

<Story name="Custom only">
  {#snippet template()}
    <ColorPicker value="#4a90d9" />
  {/snippet}
</Story>

<Story name="With opacity">
  {#snippet template()}
    <ColorPicker alpha format="rgb" value="rgb(192 57 43 / 0.6)" />
  {/snippet}
</Story>

<Story name="In a FormField">
  {#snippet template()}
    <FormField label="Bed colour" hint="Used for this bed on the plan.">
      {#snippet children(control)}
        <ColorPicker {...control} name="colour" swatches={bedColours} value="#8fbc5a" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>
