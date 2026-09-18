<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import CheckboxGroup from '../../lib/fields/CheckboxGroup.svelte';

  const { Story } = defineMeta({
    title: 'Fields/CheckboxGroup',
    component: CheckboxGroup,
    parameters: {
      docs: {
        description: {
          component:
            'Several checkboxes answering one question, inside one `Fieldset`. `values` is the list of ticked values, bindable — a plain array, because that is what a decoded form body and a JSON payload both look like.',
        },
      },
    },
  });

  const conditions = [
    { value: 'full-sun', label: 'Full sun' },
    { value: 'part-shade', label: 'Part shade' },
    { value: 'full-shade', label: 'Full shade' },
    { value: 'bog', label: 'Permanently wet', disabled: true },
  ];
</script>

<script lang="ts">
  let chosen = $state(['full-sun']);
</script>

<Story name="Default">
  <div class="max-w-sm">
    <CheckboxGroup
      legend="Growing conditions"
      hint="Tick everything this plant tolerates."
      name="conditions"
      options={conditions}
      bind:values={chosen}
    />
    <p class="text-base-content/70 mt-3 text-sm">Ticked: {chosen.join(', ') || 'nothing'}</p>
  </div>
</Story>

<Story name="Required, with errors">
  <div class="max-w-sm">
    <CheckboxGroup
      legend="Growing conditions"
      required
      errors={['Choose at least one condition.']}
      options={conditions}
      values={[]}
    />
  </div>
</Story>
