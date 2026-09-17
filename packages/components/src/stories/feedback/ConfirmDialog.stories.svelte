<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ConfirmDialog from '../../lib/feedback/ConfirmDialog.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/ConfirmDialog',
    component: ConfirmDialog,
    parameters: {
      docs: {
        description: {
          component:
            'A destructive action behind a modal confirmation, in two shapes: `onConfirm` for a client-side promise (pending state, failure shown inside the still-open dialog), or `form` for a progressive-enhancement POST whose confirm button is a real `type="submit"` inside a real `<form>`. The SvelteKit `enhance` action is passed in by the app.',
        },
      },
    },
  });

  const settle = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const succeed = (): Promise<unknown> => settle(900);
  const fail = async (): Promise<unknown> => {
    await settle(900);
    throw new Error('This garden still has 12 plants in it.');
  };
</script>

<Story name="Callback, succeeds">
  <ConfirmDialog
    title="Delete this garden?"
    description="Every bed, plant and photo in it goes too. This cannot be undone."
    onConfirm={succeed}
  >
    {#snippet trigger({ props })}
      <Button {...props} tone="error" variant="outline">Delete garden</Button>
    {/snippet}
  </ConfirmDialog>
</Story>

<Story name="Callback, fails">
  <ConfirmDialog title="Delete this garden?" onConfirm={fail} confirmLabel="Delete it">
    {#snippet trigger({ props })}
      <Button {...props} tone="error" variant="outline">Delete garden</Button>
    {/snippet}
  </ConfirmDialog>
</Story>

<Story name="Form POST, works without JavaScript">
  <ConfirmDialog
    title="Delete this accession?"
    description="An accession record is hard-deleted: there is no version chain to restore it from."
    form={{ action: '?/delete', fields: { id: 'acc-2291' } }}
    confirmLabel="Delete accession"
  >
    {#snippet trigger({ props })}
      <Button {...props} tone="error" size="sm">Delete accession</Button>
    {/snippet}
    <p class="text-sm">Accession <strong>acc-2291</strong>, recorded 14 September.</p>
  </ConfirmDialog>
</Story>

<Story name="A gentler tone">
  <ConfirmDialog
    title="Archive this bed?"
    description="It disappears from the garden’s listing. You can restore it later."
    tone="warning"
    confirmLabel="Archive"
    onConfirm={succeed}
  >
    {#snippet trigger({ props })}
      <Button {...props} tone="warning" variant="soft">Archive bed</Button>
    {/snippet}
  </ConfirmDialog>
</Story>
