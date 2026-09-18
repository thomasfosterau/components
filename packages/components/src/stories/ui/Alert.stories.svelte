<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Alert from '../../lib/ui/Alert.svelte';

  const { Story } = defineMeta({
    title: 'UI/Alert',
    component: Alert,
    parameters: {
      docs: {
        description: {
          component:
            '`live` decides whether — and how urgently — the notice is announced: `role="alert"` interrupts, `role="status"` waits for a pause, `off` renders no role at all. `error` defaults to assertive; everything else to polite. Page furniture that is present on load should say `live="off"`.',
        },
      },
    },
  });
</script>

<Story name="Tones">
  <div class="flex flex-col gap-3">
    <Alert live="off">Seedlings are watered automatically between 5am and 6am.</Alert>
    <Alert tone="success" live="off">Your garden was saved.</Alert>
    <Alert tone="warning" live="off">Frost is forecast for Thursday night.</Alert>
    <Alert tone="error" live="off">That garden could not be deleted.</Alert>
  </div>
</Story>

<Story name="With a title">
  <Alert tone="warning" title="Frost warning" live="off">
    Two of the beds you follow are below 2 °C tonight. Cover anything tender.
  </Alert>
</Story>

<Story name="Variants">
  <div class="flex flex-col gap-3">
    <Alert tone="info" variant="solid" live="off">Solid</Alert>
    <Alert tone="info" variant="soft" live="off">Soft — the default</Alert>
    <Alert tone="info" variant="outline" live="off">Outline</Alert>
    <Alert tone="info" variant="dash" live="off">Dash</Alert>
  </div>
</Story>

<Story name="Dismissible">
  <Alert tone="success" live="off" onDismiss={() => undefined} dismissLabel="Dismiss this notice">
    Your changes were published.
  </Alert>
</Story>
