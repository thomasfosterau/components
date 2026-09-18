<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ProgressBar from '../../lib/feedback/ProgressBar.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/ProgressBar',
    component: ProgressBar,
    parameters: {
      docs: {
        description: {
          component:
            'A native `<progress>` in a daisyUI tone. `label` is the accessible name and `aria-valuetext` carries the percentage as words; omitting `value` leaves the element genuinely indeterminate, which is the state no hand-rolled bar gets right.',
        },
      },
    },
  });
</script>

<Story name="With a value">
  <div class="max-w-md space-y-4">
    <ProgressBar label="Seeds germinated" value={62} showValue />
    <ProgressBar label="Beds photographed" value={19} max={31} tone="secondary" showValue />
    <ProgressBar label="Storage used" value={94} tone="warning" showValue />
  </div>
</Story>

<Story name="Indeterminate">
  <div class="max-w-md">
    <ProgressBar label="Importing the seed list" />
  </div>
</Story>

<Story name="Every tone">
  <div class="max-w-md space-y-3">
    <ProgressBar label="Neutral" tone="neutral" value={40} />
    <ProgressBar label="Primary" tone="primary" value={45} />
    <ProgressBar label="Secondary" tone="secondary" value={50} />
    <ProgressBar label="Accent" tone="accent" value={55} />
    <ProgressBar label="Info" tone="info" value={60} />
    <ProgressBar label="Success" tone="success" value={65} />
    <ProgressBar label="Warning" tone="warning" value={70} />
    <ProgressBar label="Error" tone="error" value={75} />
  </div>
</Story>
