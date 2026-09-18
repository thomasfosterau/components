<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';
  import Textarea from '../../lib/fields/Textarea.svelte';

  const { Story } = defineMeta({
    title: 'Fields/FormField',
    component: FormField,
    parameters: {
      docs: {
        description: {
          component:
            'The label + hint + errors frame around one control. It derives `hintId` and `errorId` from a single `id` and hands the control a `FieldControl` to spread, so `for`, `aria-describedby` and `aria-invalid` cannot drift apart. `errors` is a list: a field that fails three rules says three things.',
        },
      },
    },
  });
</script>

<Story name="Label only">
  <FormField label="Scientific name">
    {#snippet children(control)}
      <TextInput {...control} value="Rosa canina" />
    {/snippet}
  </FormField>
</Story>

<Story name="With a hint">
  <FormField label="Scientific name" hint="Genus and species, as published.">
    {#snippet children(control)}
      <TextInput {...control} value="Rosa canina" />
    {/snippet}
  </FormField>
</Story>

<Story name="Required">
  <FormField label="Scientific name" hint="Genus and species, as published." required>
    {#snippet children(control)}
      <TextInput {...control} value="" placeholder="Rosa canina" />
    {/snippet}
  </FormField>
</Story>

<Story name="One error">
  <FormField label="Scientific name" errors={['That name is already recorded.']}>
    {#snippet children(control)}
      <TextInput {...control} value="Rosa canina" />
    {/snippet}
  </FormField>
</Story>

<Story name="Several errors, with a hint">
  <FormField
    label="Notes"
    hint="Anything a later reader would want to know."
    errors={['Keep this under 500 characters.', 'Links must be absolute.']}
  >
    {#snippet children(control)}
      <Textarea {...control} value="See http://example" />
    {/snippet}
  </FormField>
</Story>
