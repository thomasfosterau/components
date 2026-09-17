<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Dialog from '../../lib/feedback/Dialog.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/Dialog',
    component: Dialog,
    parameters: {
      docs: {
        description: {
          component:
            'A modal on bits-ui’s `Dialog` wearing daisyUI’s `modal-box`. The focus trap, the `aria-labelledby` / `aria-describedby` wiring, Escape, the scroll lock and the focus return are all bits-ui’s. `trigger` receives the props to spread onto the caller’s own control; `actions` receives `close`.',
        },
      },
    },
  });
</script>

<Story name="With a trigger and actions">
  <Dialog
    title="Move this plant?"
    description="It keeps its history — only the bed it is recorded in changes."
  >
    {#snippet trigger({ props })}
      <Button {...props} variant="outline">Move plant</Button>
    {/snippet}
    <p class="text-sm">
      ‘Black Krim’ moves from <strong>North bed</strong> to <strong>Glasshouse</strong>. Anything
      logged against it stays where it is.
    </p>
    {#snippet actions({ close })}
      <Button variant="ghost" onclick={close}>Cancel</Button>
      <Button tone="primary" onclick={close}>Move it</Button>
    {/snippet}
  </Dialog>
</Story>

<Story name="Large, no action row">
  <Dialog title="Watering schedule" size="lg" closeLabel="Close the schedule">
    {#snippet trigger({ props })}
      <Button {...props}>Show the schedule</Button>
    {/snippet}
    <ul class="list-disc space-y-1 pl-5 text-sm">
      <li>North bed — every second day, 5am</li>
      <li>Glasshouse — daily, 5:20am</li>
      <li>Orchard — weekly, Sunday 6am</li>
    </ul>
  </Dialog>
</Story>

<Story name="Small">
  <Dialog title="Renamed" description="The bed is now called ‘Glasshouse’." size="sm">
    {#snippet trigger({ props })}
      <Button {...props} size="sm">What changed?</Button>
    {/snippet}
    <p class="text-sm">Every page that referenced it has been updated.</p>
  </Dialog>
</Story>
