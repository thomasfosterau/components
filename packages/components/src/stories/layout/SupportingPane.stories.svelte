<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SupportingPane from '../../lib/layout/SupportingPane.svelte';

  const { Story } = defineMeta({
    title: 'Layout/SupportingPane',
    component: SupportingPane,
    parameters: {
      docs: {
        description: {
          component:
            'A main pane with an inspector: a `complementary` column from `expandAt` up, a `Drawer` below it. Resize the canvas below 1024px and use the toggle to see the drawer.',
        },
      },
    },
  });
</script>

{#snippet properties()}
  <dl class="space-y-2 text-sm">
    <div><dt class="font-medium">Size</dt><dd>2 × 1.2 m</dd></div>
    <div><dt class="font-medium">Soil</dt><dd>Loam, pH 6.5</dd></div>
  </dl>
{/snippet}

<Story name="Inspector over a canvas">
  <SupportingPane title="Properties" toggleLabel="Properties" supporting={properties}>
    <div class="bg-base-200 text-base-content/60 flex h-80 items-center justify-center rounded-box">
      Plan canvas
    </div>
  </SupportingPane>
</Story>
