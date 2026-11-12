<script lang="ts">
  import LeaveGuardDialog from '../../../src/lib/forms/LeaveGuardDialog.svelte';
  import { createLeaveGuard, type LeaveGuard } from '../../../src/lib/forms/leave-guard.svelte.ts';

  interface Props {
    dirty: boolean;
    onGuard: (guard: LeaveGuard) => void;
  }

  let { dirty, onGuard }: Props = $props();

  const guard = createLeaveGuard({ dirty: () => dirty });
  // The test takes the guard once, at mount.
  // svelte-ignore state_referenced_locally
  onGuard(guard);
</script>

<p>The editor</p>
<LeaveGuardDialog {guard} />
