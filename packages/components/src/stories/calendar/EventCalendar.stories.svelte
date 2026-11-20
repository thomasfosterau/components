<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import EventCalendar from '../../lib/calendar/EventCalendar.svelte';
  import type { CalendarEvent } from '../../lib/calendar/events.ts';

  const { Story } = defineMeta({
    title: 'Calendar/EventCalendar',
    component: EventCalendar,
    parameters: {
      docs: {
        description: {
          component:
            'Dated events in a month grid (an APG grid: arrows, Page Up/Down, Enter into a day) or an agenda list, the default on narrow screens. From `@thomasfosterau/components/calendar`.',
        },
      },
    },
  });

  const planting: CalendarEvent[] = [
    { id: 'sow-tom', title: 'Sow tomatoes', start: '2026-10-05', tone: 'success', category: 'Sowing' },
    { id: 'sow-basil', title: 'Sow basil', start: '2026-10-05', tone: 'success', category: 'Sowing' },
    { id: 'plant-beans', title: 'Plant out beans', start: '2026-10-12', end: '2026-10-14', tone: 'info', category: 'Transplanting' },
    { id: 'mulch', title: 'Mulch beds', start: '2026-10-17T08:00', end: '2026-10-17T11:00', tone: 'warning', category: 'Maintenance' },
    { id: 'garlic', title: 'Harvest garlic', start: '2026-10-28', tone: 'secondary', category: 'Harvest' },
    { id: 'peas', title: 'Harvest peas', start: '2026-10-28', tone: 'secondary', category: 'Harvest' },
  ];

  const roster: CalendarEvent[] = Array.from({ length: 10 }, (_, index) => {
    const day = `2026-10-${String((index + 1) * 3).padStart(2, '0')}`;
    return [
      { id: `am-${day}`, title: 'Morning watering', start: `${day}T07:30`, end: `${day}T08:30` },
      { id: `pm-${day}`, title: 'Evening watering', start: `${day}T18:00`, end: `${day}T19:00` },
    ];
  }).flat();

  const crowded: CalendarEvent[] = Array.from({ length: 7 }, (_, index) => ({
    id: `job-${index}`,
    title: ['Weed', 'Prune', 'Feed', 'Stake', 'Net', 'Label', 'Compost'][index] ?? 'Job',
    start: '2026-10-21',
    tone: 'accent',
    category: 'Working bee',
  }));
</script>

<Story name="Planting schedule">
  {#snippet template()}
    <EventCalendar events={planting} date="2026-10-17" view="month" locales="en-AU" />
  {/snippet}
</Story>

<Story name="Agenda">
  {#snippet template()}
    <EventCalendar events={planting} date="2026-10-17" view="agenda" locales="en-AU" />
  {/snippet}
</Story>

<Story name="Roster">
  {#snippet template()}
    <EventCalendar events={roster} date="2026-10-01" view="month" locales="en-US" />
  {/snippet}
</Story>

<Story name="Crowded month">
  {#snippet template()}
    <EventCalendar events={crowded} date="2026-10-21" view="month" maxPerDay={2} locales="en-AU" />
  {/snippet}
</Story>

<Story name="Time zone">
  {#snippet template()}
    <p class="mb-2 text-sm">A 9 pm UTC call, shown in Melbourne the next morning.</p>
    <EventCalendar
      events={[{ id: 'call', title: 'Seed swap call', start: '2026-10-20T21:00Z', end: '2026-10-20T22:00Z' }]}
      date="2026-10-21"
      view="agenda"
      timeZone="Australia/Melbourne"
      locales="en-AU"
    />
  {/snippet}
</Story>
