<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Timeline from '../../lib/feedback/Timeline.svelte';
  import type { TimelineEntry } from '../../lib/feedback/Timeline.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/Timeline',
    component: Timeline,
    parameters: {
      docs: {
        description: {
          component:
            'A dated sequence as an `<ol>`, because the order is the content. An open-ended entry reads as current; the dash between dates is `aria-hidden` and `toLabel` is read in its place, so a span is announced as a range.',
        },
      },
    },
  });

  const beds: TimelineEntry[] = [
    {
      id: 'glasshouse',
      label: 'Glasshouse',
      subtitle: 'Tomatoes, chillies, basil',
      start: { label: 'March 2024', dateTime: '2024-03-01' },
      href: '/beds/glasshouse',
      colourToken: '--bed-glasshouse',
    },
    {
      id: 'north',
      label: 'North bed',
      subtitle: 'Brassicas',
      start: { label: 'September 2022', dateTime: '2022-09-14' },
      end: { label: 'February 2024', dateTime: '2024-02-28' },
      href: '/beds/north',
    },
    {
      id: 'trial',
      label: 'Trial row',
      start: { label: 'May 2021', dateTime: '2021-05-02' },
      end: { label: 'August 2022', dateTime: '2022-08-30' },
    },
  ];
</script>

<Story name="A history">
  <Timeline items={beds} label="Beds this plant has grown in" />
</Story>

<Story name="Custom wording">
  <Timeline items={beds} label="Beds" presentLabel="still growing" currentLabel="Currently:" />
</Story>

<Story name="A custom entry body">
  <Timeline items={beds} label="Beds">
    {#snippet item(entry)}
      <p class="font-semibold uppercase">{entry.label}</p>
      {#if entry.subtitle !== undefined}
        <p class="text-base-content/70 text-xs">{entry.subtitle}</p>
      {/if}
    {/snippet}
  </Timeline>
</Story>
