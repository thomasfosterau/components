<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Checkbox from '../../lib/fields/Checkbox.svelte';
  import Fieldset from '../../lib/fields/Fieldset.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Fieldset',
    component: Fieldset,
    parameters: {
      docs: {
        description: {
          component:
            'The `FormField` frame for a GROUP: a real `<fieldset>` and `<legend>`, with the hint and the errors described from the fieldset itself. Use it when several controls answer one question and no single control can carry the label.',
        },
      },
    },
  });
</script>

<Story name="A group of checkboxes">
  <Fieldset legend="Taxon flags" hint="Four independent facts about the name.">
    <Checkbox label="Formally published" checked />
    <Checkbox label="Placement certain" />
    <Checkbox label="Cultigen" />
    <Checkbox label="Hybrid" />
  </Fieldset>
</Story>

<Story name="Required, with errors">
  <Fieldset
    legend="Growing conditions"
    required
    errors={['Choose at least one condition.']}
  >
    <Checkbox label="Full sun" />
    <Checkbox label="Part shade" />
    <Checkbox label="Full shade" />
  </Fieldset>
</Story>
