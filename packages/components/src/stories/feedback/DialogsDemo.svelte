<!-- Story helper: a bed list driven by `getDialogs()`. It has to run during a
     DESCENDANT's init, so it cannot live in the story file. Not a component of
     the library. -->
<script lang="ts">
  import { getDialogs } from '../../lib/feedback/dialogs.ts';
  import Button from '../../lib/ui/Button.svelte';

  const dialogs = getDialogs();

  let beds = $state(['North bed', 'Glasshouse', 'Herb spiral']);
  let status = $state('');

  const remove = async (bed: string): Promise<void> => {
    const ok = await dialogs.confirm({
      title: `Delete ${bed}?`,
      description: 'Its plants move to Unassigned.',
      confirmLabel: 'Delete',
      tone: 'error',
    });
    if (ok) beds = beds.filter((other) => other !== bed);
    status = ok ? `${bed} deleted.` : 'Nothing deleted.';
  };

  /** Delete or Backspace on a row deletes it, after asking. */
  const onkeydown = (event: KeyboardEvent, bed: string): void => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    void remove(bed);
  };

  /** A multi-step flow: ask for a name, then confirm before adding. */
  const add = async (): Promise<void> => {
    const name = await dialogs.prompt({
      title: 'New bed',
      label: 'Name',
      confirmLabel: 'Next',
      validate: (value) => (value.trim() === '' ? ['A bed needs a name.'] : []),
    });
    if (name === undefined) return;
    if (beds.includes(name)) {
      await dialogs.alert({ title: 'That name is taken', description: `There is already a bed called ${name}.` });
      return;
    }
    if (await dialogs.confirm({ title: `Add ${name}?`, confirmLabel: 'Add' })) beds = [...beds, name];
  };
</script>

<div class="space-y-4 p-4">
  <p class="text-sm">Focus a bed and press Delete, or add one.</p>
  <ul class="menu bg-base-200 rounded-box w-64" aria-label="Beds">
    {#each beds as bed (bed)}
      <li>
        <button type="button" onkeydown={(event) => onkeydown(event, bed)} onclick={() => remove(bed)}>{bed}</button>
      </li>
    {/each}
  </ul>
  <Button tone="primary" onclick={add}>New bed…</Button>
  <p role="status" class="text-sm">{status}</p>
</div>
