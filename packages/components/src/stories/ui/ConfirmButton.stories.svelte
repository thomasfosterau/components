<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ConfirmButton from '../../lib/ui/ConfirmButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/ConfirmButton',
    component: ConfirmButton,
    parameters: {
      docs: {
        description: {
          component:
            'A destructive action behind a two-step inline confirm. Inline rather than a dialog: the confirmation replaces the button in place, so nothing is torn out of the reading order and focus is not trapped. A rejection surfaces in an `Alert live="assertive"`.',
        },
      },
    },
  });

  const settle = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const succeed = (): Promise<unknown> => settle(800);
  const fail = async (): Promise<unknown> => {
    await settle(800);
    throw new Error('This garden still has 12 plants in it.');
  };
</script>

<Story name="Succeeds">
  <ConfirmButton
    action={succeed}
    idleLabel="Delete this garden"
    confirmMessage="Delete the garden and everything in it?"
  />
</Story>

<Story name="Fails">
  <ConfirmButton action={fail} idleLabel="Delete this garden" />
</Story>

<Story name="Another tone">
  <ConfirmButton
    action={succeed}
    tone="warning"
    idleLabel="Archive this garden"
    confirmMessage="Archive it? You can restore it later."
    confirmLabel="Archive"
  />
</Story>

{#snippet idField()}
  <input type="hidden" name="id" value="garden-7" />
{/snippet}

<!--
  Form mode: the confirm step is a real POST form, so it works with scripts
  off. The wrapper here only stops the story's own page being submitted away.
-->
<Story name="Form mode, no JavaScript needed">
  <div
    onsubmit={(event) => {
      event.preventDefault();
    }}
  >
    <ConfirmButton
      formAction="/gardens/7?/delete"
      formFields={idField}
      idleLabel="Delete this garden"
      confirmMessage="Delete the garden and everything in it?"
    />
  </div>
</Story>
