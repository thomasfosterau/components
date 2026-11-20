<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Meter from '../../lib/feedback/Meter.svelte';
  import RadialProgress from '../../lib/feedback/RadialProgress.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/Meter',
    component: Meter,
    parameters: {
      docs: {
        description: {
          component:
            'A measurement within a known range on a native `<meter>`: storage used, soil moisture, a battery. `low`, `high` and `optimum` give the platform good, fair and poor states, drawn in success, warning and error. `ProgressBar` is for completion of a task; `RadialProgress` draws either as a ring.',
        },
      },
    },
  });
</script>

<Story name="Storage with thresholds">
  <div class="flex max-w-md flex-col gap-4">
    {#each [2.1, 6.4, 9.3] as used (used)}
      <Meter
        label="Storage used"
        value={used}
        max={10}
        low={5}
        high={8}
        optimum={0}
        valueText={`${used} GB of 10 GB`}
        showValue
      />
    {/each}
  </div>
</Story>

<Story name="Radial: soil moisture (meter)">
  <div class="flex gap-6">
    <RadialProgress label="Bed 1 soil moisture" kind="meter" value={0.34} max={1} tone="info" />
    <RadialProgress label="Bed 2 soil moisture" kind="meter" value={0.72} max={1} tone="success" size="lg" />
  </div>
</Story>

<Story name="Radial: upload (progress)">
  <div class="flex gap-6">
    <RadialProgress label="Uploading photos" value={62} />
    <RadialProgress label="Preparing upload" />
  </div>
</Story>
