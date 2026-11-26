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
            'Dated events in a month grid (an APG grid: arrows, Page Up/Down, Enter into a day), week and day time grids (events in time order, overlaps side by side, a slot by dragging or "New event"), or an agenda list, the default on narrow screens. From `@thomasfosterau/components/calendar`.',
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

  const workshops: CalendarEvent[] = [
    { id: 'fair', title: 'Spring fair', start: '2026-10-21', end: '2026-10-22', tone: 'accent', category: 'Event' },
    { id: 'compost', title: 'Composting basics', start: '2026-10-19T10:00', end: '2026-10-19T12:00', tone: 'info', category: 'Workshop' },
    { id: 'water-a', title: 'Watering: beds 1–4', start: '2026-10-20T07:00', end: '2026-10-20T08:30', tone: 'success', category: 'Roster' },
    { id: 'water-b', title: 'Watering: beds 5–8', start: '2026-10-20T07:30', end: '2026-10-20T09:00', tone: 'success', category: 'Roster' },
    { id: 'tools', title: 'Tool shed check', start: '2026-10-20T08:00', end: '2026-10-20T08:30', tone: 'warning', category: 'Maintenance' },
    { id: 'grafting', title: 'Grafting fruit trees', start: '2026-10-22T13:00', end: '2026-10-22T16:00', tone: 'info', category: 'Workshop' },
    { id: 'seeds', title: 'Seed library shift', start: '2026-10-22T14:00', end: '2026-10-22T15:00', tone: 'success', category: 'Roster' },
    { id: 'bees', title: 'Beekeeping', start: '2026-10-24T09:00', end: '2026-10-24T11:30', tone: 'secondary', category: 'Workshop' },
  ];
</script>

<script lang="ts">
  let booked: CalendarEvent[] = $state([...workshops]);
  const book = (start: string, end: string): void => {
    booked = [...booked, { id: `booking-${booked.length}`, title: 'New booking', start, end, tone: 'primary' }];
  };
</script>

<Story name="Planting schedule" asChild>
  <EventCalendar events={planting} date="2026-10-17" view="month" locales="en-AU" />
</Story>

<Story name="Agenda" asChild>
  <EventCalendar events={planting} date="2026-10-17" view="agenda" locales="en-AU" />
</Story>

<Story name="Roster" asChild>
  <EventCalendar events={roster} date="2026-10-01" view="month" locales="en-US" />
</Story>

<Story name="Crowded month" asChild>
  <EventCalendar events={crowded} date="2026-10-21" view="month" maxPerDay={2} locales="en-AU" />
</Story>

<Story name="Time zone" asChild>
  <p class="mb-2 text-sm">A 9 pm UTC call, shown in Melbourne the next morning.</p>
  <EventCalendar
    events={[{ id: 'call', title: 'Seed swap call', start: '2026-10-20T21:00Z', end: '2026-10-20T22:00Z' }]}
    date="2026-10-21"
    view="agenda"
    timeZone="Australia/Melbourne"
    locales="en-AU"
  />
</Story>

<Story name="Week" asChild>
  <EventCalendar events={workshops} date="2026-10-20" view="week" locales="en-AU" />
</Story>

<Story name="Day" asChild>
  <EventCalendar events={workshops} date="2026-10-20" view="day" hours={[6, 12]} locales="en-AU" />
</Story>

<Story name="Booking a slot" asChild>
  <p class="mb-2 text-sm">Drag over the hours, or press a day's "New event", to add a booking.</p>
  <EventCalendar events={booked} date="2026-10-20" view="week" locales="en-AU" onSlotSelect={book} />
</Story>
