<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PromptDialog from '../../lib/feedback/PromptDialog.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/PromptDialog',
    component: PromptDialog,
    parameters: {
      docs: {
        description: {
          component:
            'A modal that asks for one short value. Focus lands in the field with its value selected; Enter submits; Confirm stays disabled — and the field says why — until the value validates. Callback mode (`onConfirm`) or a progressive-enhancement POST (`form`).',
        },
      },
    },
  });

  const settle = (ms: number, signal: AbortSignal): Promise<void> =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
      });
    });

  const taken = new Set(['Herb spiral', 'Bed 4']);
  const unique = async (value: string, signal: AbortSignal): Promise<readonly string[]> => {
    await settle(400, signal);
    if (value.trim() === '') return ['A collection needs a name.'];
    return taken.has(value.trim()) ? ['That name is taken.'] : [];
  };
  const save = (_value: string, signal: AbortSignal): Promise<void> => settle(800, signal);
</script>

{#snippet renameTrigger({ props }: { props: Record<string, unknown> })}
  <Button {...props} variant="outline">Rename bed…</Button>
{/snippet}
{#snippet newTrigger({ props }: { props: Record<string, unknown> })}
  <Button {...props} tone="primary">New collection…</Button>
{/snippet}
{#snippet deleteTrigger({ props }: { props: Record<string, unknown> })}
  <Button {...props} tone="error" variant="soft">Delete plan…</Button>
{/snippet}

<Story name="Rename">
  <PromptDialog
    title="Rename bed"
    label="Name"
    value="Bed 4"
    confirmLabel="Rename"
    onConfirm={save}
    validate={(value) => (value.trim() === '' ? ['A bed needs a name.'] : [])}
    trigger={renameTrigger}
  />
</Story>

<Story name="New item, with an async uniqueness check">
  <!-- "Herb spiral" and "Bed 4" are taken. -->
  <PromptDialog
    title="New collection"
    label="Collection name"
    hint="Shown on the collection's page."
    confirmLabel="Create"
    validate={unique}
    onConfirm={save}
    trigger={newTrigger}
  />
</Story>

<Story name="Type to confirm a delete">
  <PromptDialog
    title="Delete the plan?"
    description="This removes the plan and every bed in it."
    label="Plan name"
    requireMatch="Allotment 14"
    tone="error"
    confirmLabel="Delete plan"
    onConfirm={save}
    trigger={deleteTrigger}
  />
</Story>
