<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Checkbox from '../../lib/fields/Checkbox.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Checkbox',
    component: Checkbox,
    parameters: {
      docs: {
        description: {
          component:
            'A checkbox with its label in the same `<label>`, so the whole row is the hit target and the input is named without an `id`/`for` pair. It carries its own label because a checkbox label sits beside it, not above it — wrap several in `CheckboxGroup` when they answer one question.',
        },
      },
    },
  });
</script>

<Story name="States">
  <div class="flex flex-col gap-1">
    <Checkbox label="Formally published" checked />
    <Checkbox label="Placement certain" />
    <Checkbox label="Cultigen" disabled />
    <Checkbox label="Hybrid" invalid />
  </div>
</Story>

<Story name="Sizes">
  <div class="flex flex-col gap-1">
    <Checkbox size="xs" label="Extra small" checked />
    <Checkbox size="sm" label="Small" checked />
    <Checkbox size="md" label="Medium — the default" checked />
    <Checkbox size="lg" label="Large" checked />
  </div>
</Story>
