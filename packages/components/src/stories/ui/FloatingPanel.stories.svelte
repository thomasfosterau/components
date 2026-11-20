<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FloatingPanel from '../../lib/ui/FloatingPanel.svelte';
  import FloatingPanelDemo from './FloatingPanelDemo.svelte';

  const { Story } = defineMeta({
    title: 'UI/FloatingPanel',
    component: FloatingPanel,
    parameters: {
      docs: {
        description: {
          component:
            'A non-modal panel over a canvas or map. Drag the title bar, or focus it and use the arrow keys (Shift resizes, Enter maximises); F6 moves between panels and the page, and Escape returns to the page without closing.',
        },
      },
    },
  });
</script>

<Story name="Layers over a canvas" asChild>
  <FloatingPanelDemo />
</Story>

<Story name="Two panels stacking" asChild>
  <FloatingPanelDemo second />
</Story>

<Story name="Minimised" asChild>
  <FloatingPanelDemo stage="minimized" />
</Story>
