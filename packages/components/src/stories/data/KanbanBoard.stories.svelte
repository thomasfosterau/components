<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import KanbanBoard from '../../lib/data/KanbanBoard.svelte';
  import KanbanDemo from './KanbanDemo.svelte';

  const { Story } = defineMeta({
    title: 'Data/KanbanBoard',
    component: KanbanBoard,
    parameters: {
      docs: {
        description: {
          component:
            'Cards move by dragging the handle, by keyboard (Space to pick up, arrows to move within and across columns, Space to drop, Escape to cancel) or through the "Move to" menu. Every step is announced.',
        },
      },
    },
  });
</script>

<Story name="Seed to harvest" asChild>
  <KanbanDemo />
</Story>

<Story name="Work in progress limits" asChild>
  <KanbanDemo limits />
</Story>

<Story name="Slow persistence with rollback" asChild>
  <KanbanDemo slow />
</Story>
