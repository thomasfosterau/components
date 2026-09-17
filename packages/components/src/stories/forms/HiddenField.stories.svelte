<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormActions from '../../lib/forms/FormActions.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import HiddenField from '../../lib/forms/HiddenField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';

  const { Story } = defineMeta({
    title: 'Forms/HiddenField',
    component: HiddenField,
    parameters: {
      docs: {
        description: {
          component:
            'A fixed value posted with the form and never edited — the parent id a create form hangs its row off, a command discriminator, a redirect target. It renders nothing visible and is not in the accessibility tree, which is exactly why nothing a reader needs to know belongs in one.',
        },
      },
    },
  });
</script>

<!--
  There is nothing to look at: the story exists to show the shape of the call
  site. Inspect the DOM to see the two hidden inputs inside the form.
-->
<Story name="Inside a form">
  <form class="max-w-sm" action="/gardens/42/plants" method="post">
    <HiddenField name="gardenId" value="42" />
    <HiddenField name="redirectTo" value="/gardens/42" />
    <FormField label="Plant name">
      {#snippet children(control)}
        <TextInput {...control} name="name" value="Rosa canina" />
      {/snippet}
    </FormField>
    <FormActions submitLabel="Add plant" cancelHref="/gardens/42" />
  </form>
</Story>
