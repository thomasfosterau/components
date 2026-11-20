<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SwipeActions from '../../lib/data/SwipeActions.svelte';
  import Toaster from '../../lib/feedback/Toaster.svelte';
  import SwipeMailDemo from './SwipeMailDemo.svelte';

  const { Story } = defineMeta({
    title: 'Data/SwipeActions',
    component: SwipeActions,
    parameters: {
      docs: {
        description: {
          component:
            'Swipe a row sideways on a touch screen (or in device emulation) to reveal its actions; a full swipe runs the first one. The "More actions" menu holds every action, so nothing depends on the gesture: visible with a mouse, visually hidden but focusable on touch. A destructive full swipe is paired with an Undo toast.',
        },
      },
    },
  });
</script>

<Story name="Mail-style list" asChild>
  <Toaster>
    <SwipeMailDemo />
  </Toaster>
</Story>

<Story name="Menu always shown" asChild>
  <Toaster>
    <SwipeMailDemo menuButton />
  </Toaster>
</Story>
