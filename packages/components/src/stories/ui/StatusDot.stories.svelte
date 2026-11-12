<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import StatusDot from '../../lib/ui/StatusDot.svelte';

  const { Story } = defineMeta({
    title: 'UI/StatusDot',
    component: StatusDot,
    parameters: {
      docs: {
        description: {
          component:
            "daisyUI's `status` dot. `label` is required and always in the text — visible with `showLabel`, screen-reader only otherwise — because a dot alone is colour alone.",
        },
      },
    },
  });
</script>

<Story name="Sensor list">
  <ul class="flex flex-col gap-2">
    <li>Sensor 1 <StatusDot tone="success" label="Online" showLabel /></li>
    <li>Sensor 2 <StatusDot tone="warning" label="Battery low" showLabel /></li>
    <li>Sensor 3 <StatusDot tone="error" label="Offline" showLabel pulse /></li>
  </ul>
</Story>

<Story name="Sizes, label for screen readers only">
  <div class="flex items-center gap-3">
    <StatusDot size="xs" tone="info" label="Syncing" />
    <StatusDot size="sm" tone="info" label="Syncing" />
    <StatusDot size="md" tone="info" label="Syncing" />
    <StatusDot size="lg" tone="info" label="Syncing" />
    <StatusDot size="xl" tone="info" label="Syncing" />
  </div>
</Story>
