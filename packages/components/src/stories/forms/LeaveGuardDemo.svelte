<script lang="ts">
  import FormField from '../../lib/fields/FormField.svelte';
  import Textarea from '../../lib/fields/Textarea.svelte';
  import LeaveGuardDialog from '../../lib/forms/LeaveGuardDialog.svelte';
  import { createLeaveGuard } from '../../lib/forms/leave-guard.svelte.ts';
  import SaveBar from '../../lib/forms/SaveBar.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const saved = 'Sow the carrots in April.';
  let notes = $state(saved);
  let outcome = $state('You are still on this page.');
  const dirty = $derived(notes !== saved);

  const guard = createLeaveGuard({ dirty: () => dirty });

  // Stands in for an in-app link, which the app's `beforeNavigate` would stop.
  const tryLeaving = async (): Promise<void> => {
    outcome = (await guard.confirmLeave()) ? 'You left the page.' : 'You stayed.';
  };
</script>

<form
  id="leave-demo"
  class="space-y-4"
  onsubmit={(event) => {
    event.preventDefault();
  }}
>
  <FormField id="leave-demo-notes" label="Notes">
    {#snippet children(control)}
      <Textarea {...control} name="notes" bind:value={notes} />
    {/snippet}
  </FormField>
</form>
<p class="mt-4 flex items-center gap-3">
  <Button variant="ghost" onclick={tryLeaving}>Go to the beds list</Button>
  <span role="status" class="text-sm">{outcome}</span>
</p>
<SaveBar
  {dirty}
  form="leave-demo"
  onDiscard={() => {
    notes = saved;
  }}
/>
<LeaveGuardDialog {guard} />
