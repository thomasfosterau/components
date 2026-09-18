<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import FormActions from '../../lib/forms/FormActions.svelte';

  const { Story } = defineMeta({
    title: 'Forms/FormActions',
    component: FormActions,
    parameters: {
      docs: {
        description: {
          component:
            'The submit / cancel row that closes a form. The submit control is a real `type="submit"` button, so Enter in any field still submits; while `pending` it is disabled AND `aria-busy`, and its label swaps — the button keeps a name throughout. Cancel is a link, because it navigates away.',
        },
      },
    },
  });
</script>

<Story name="Submit and cancel">
  <FormActions submitLabel="Create garden" cancelHref="/gardens" />
</Story>

<Story name="Pending">
  <FormActions submitLabel="Create garden" pendingLabel="Creating…" pending cancelHref="/gardens" />
</Story>

<Story name="Submit alone">
  <FormActions submitLabel="Save notes" />
</Story>

<Story name="With an extra control">
  <FormActions submitLabel="Publish" cancelHref="/gardens">
    <Button variant="ghost">Save as a draft</Button>
  </FormActions>
</Story>
