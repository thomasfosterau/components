<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import Slider from '../../lib/fields/Slider.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Slider',
    component: Slider,
    parameters: {
      docs: {
        description: {
          component:
            'A number, or a `[low, high]` range, from a bounded, stepped scale, on bits-ui’s `Slider`. Arrow keys step, Page Up / Page Down jump a tenth of the scale, Home / End go to the ends; in range mode the thumbs cannot cross.',
        },
      },
    },
  });
</script>

<Story name="Single">
  <div class="max-w-sm">
    <Slider label="Sowing depth" min={0} max={10} value={2} formatValue={(v) => `${v} cm`} />
  </div>
</Story>

<Story name="Range">
  <div class="max-w-sm">
    <Slider
      type="multiple"
      label="Price"
      min={0}
      max={200}
      step={5}
      value={[20, 80]}
      formatValue={(v) => `$${v}`}
    />
  </div>
</Story>

<Story name="Ticks">
  <div class="max-w-sm">
    <Slider label="Minimum hours of sun" min={0} max={8} value={4} ticks formatValue={(v) => `${v} h`} />
  </div>
</Story>

<Story name="Vertical">
  <Slider label="Water level" orientation="vertical" value={60} tone="info" formatValue={(v) => `${v}%`} />
</Story>

<Story name="Invalid">
  <div class="max-w-sm">
    <Slider label="Spacing" min={0} max={100} value={90} invalid />
  </div>
</Story>

<Story name="Inside FormField">
  <!-- `{...control}` alone names it: every thumb is `aria-labelledby` the FormField's `labelId`. -->
  <div class="max-w-sm">
    <FormField label="Hours of sun" hint="Full sun is six hours or more." errors={['Most roses need at least four hours.']}>
      {#snippet children(control)}
        <Slider {...control} name="sun" min={0} max={12} value={3} formatValue={(v) => `${v} h`} />
      {/snippet}
    </FormField>
  </div>
</Story>
