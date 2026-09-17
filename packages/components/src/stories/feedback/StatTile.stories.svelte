<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Sprout } from '@lucide/svelte';
  import Stats from '../../lib/feedback/Stats.svelte';
  import StatTile from '../../lib/feedback/StatTile.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/StatTile',
    component: StatTile,
    parameters: {
      docs: {
        description: {
          component:
            'One daisyUI `stat`, in the `Stats` wrapper that draws the dividers. The arrow beside a delta is `aria-hidden`, so the direction is also spelled out in visually hidden text — the tone colour is never the only carrier.',
        },
      },
    },
  });
</script>

<Story name="A dashboard row">
  <Stats>
    <StatTile label="Plants recorded" value={1284} delta={{ value: 46, label: 'this month' }} />
    <StatTile
      label="Beds in use"
      value={31}
      delta={{ value: -2, label: 'this month' }}
      description="Two were archived after the frost."
    />
    <StatTile label="Germination rate" value="68%" delta={{ value: 3.2, unit: 'percent' }} />
  </Stats>
</Story>

<Story name="Vertical, with a figure">
  <Stats orientation="vertical">
    <StatTile label="Seedlings" value={412} delta={{ value: 0, label: 'this week' }}>
      {#snippet figure()}
        <Sprout class="text-success size-8" aria-hidden="true" />
      {/snippet}
    </StatTile>
    <StatTile label="Awaiting identification" value={17} description="Oldest is 12 days old." />
  </Stats>
</Story>

<Story name="A lone tile">
  <Stats orientation="horizontal">
    <StatTile label="Swing" value="+4.1 pts" delta={{ value: 4.1, unit: 'points', label: 'swing' }} />
  </Stats>
</Story>
