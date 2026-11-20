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

  const beds = [
    { value: 'raised', label: 'Raised bed', description: 'Warms early and drains well.' },
    { value: 'in-ground', label: 'In-ground bed', description: 'Holds moisture through summer.' },
    { value: 'containers', label: 'Containers', description: 'Movable, for balconies and patios.' },
    { value: 'greenhouse', label: 'Greenhouse', description: 'Frost-free growing all year.' },
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

<Story name="With a select-all parent">
  <!-- The parent is mixed while some are ticked, and never touches a disabled option. -->
  <div class="max-w-sm">
    <CheckboxGroup
      legend="Growing conditions"
      options={conditions}
      values={['full-sun']}
      selectAll
      selectAllLabel="All conditions"
    />
  </div>
</Story>

<Story name="Cards">
  <CheckboxGroup legend="Where do you grow?" name="beds" variant="cards" columns="auto" options={beds} values={['raised']} />
</Story>

<Story name="Cards, no checkbox">
  <CheckboxGroup legend="Where do you grow?" variant="cards" columns={2} indicator="hidden" options={beds} values={['containers']} />
</Story>
