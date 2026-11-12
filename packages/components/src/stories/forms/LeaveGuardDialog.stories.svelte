<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LeaveGuardDialog from '../../lib/forms/LeaveGuardDialog.svelte';
  import LeaveGuardDemo from './LeaveGuardDemo.svelte';

  const { Story } = defineMeta({
    title: 'Forms/LeaveGuardDialog',
    component: LeaveGuardDialog,
    parameters: {
      docs: {
        description: {
          component:
            'The Leave / Stay question of `createLeaveGuard`, an `alertdialog` with focus on Stay and Escape as Stay. Edit the notes, then press "Go to the beds list" (standing in for an in-app link that `beforeNavigate` would stop). Closing the tab while dirty also raises the browser’s own prompt; clean pages register nothing, so the back/forward cache stays on.',
        },
      },
    },
  });
</script>

<Story name="Editor with a leave guard">
  <LeaveGuardDemo />
</Story>
