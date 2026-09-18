<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Toaster from '../../lib/feedback/Toaster.svelte';
  import ToastTrigger from './ToastTrigger.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/Toaster',
    component: Toaster,
    parameters: {
      docs: {
        description: {
          component:
            'The notification region plus the context any descendant pushes into with `getToaster().add(...)`. ONE `aria-live="polite"` region, in the document from mount and named by `regionLabel`; nothing inside it is live, because a `role="status"` per toast is announced twice.',
        },
      },
    },
  });
</script>

<Story name="Four tones">
  <Toaster>
    <div class="flex flex-wrap gap-2 p-4">
      <ToastTrigger buttonLabel="Saved" title="Bed saved" tone="success" />
      <ToastTrigger
        buttonLabel="Something to know"
        title="Watering paused"
        description="Rain is forecast until Thursday."
        tone="info"
      />
      <ToastTrigger
        buttonLabel="A warning"
        title="Two photos were skipped"
        description="They were larger than 10 MB."
        tone="warning"
      />
      <ToastTrigger
        buttonLabel="A failure"
        title="Could not save the bed"
        description="The server refused the change."
        tone="error"
        buttonTone="error"
      />
    </div>
  </Toaster>
</Story>

<Story name="Top left, sticky">
  <Toaster position="top-start" durationMs={0} dismissLabel="Dismiss this notification">
    <div class="flex flex-wrap gap-2 p-4">
      <ToastTrigger
        buttonLabel="Push a sticky toast"
        title="Import running"
        description="This one stays until it is dismissed."
        tone="info"
      />
    </div>
  </Toaster>
</Story>
