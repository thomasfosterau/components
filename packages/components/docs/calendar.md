# Calendar

`EventCalendar`, from `@thomasfosterau/components/calendar`, shows dated events: a planting and harvest schedule, a volunteer roster, workshop bookings. It is a separate entry because most apps never need it.

```svelte
<script lang="ts">
  import { EventCalendar, type CalendarEvent } from '@thomasfosterau/components/calendar';

  const events: CalendarEvent[] = [
    { id: 'sow', title: 'Sow tomatoes', start: '2026-10-23', tone: 'success', category: 'Sowing' },
    { id: 'roster', title: 'Watering roster', start: '2026-10-24T09:00', end: '2026-10-24T10:30' },
  ];
</script>

<EventCalendar {events} onEventSelect={(event) => open(event.id)} />
```

## Events

- `start` and `end` are ISO 8601. A date alone is an all-day event, and its `end` is the last day it covers. A date-time without an offset is wall time in `timeZone` (the browser's by default); one with an offset or `Z` is that instant.
- Events are concrete. Expand recurrences (an RRULE) in the app and pass the occurrences.
- `tone` colours the event's dot. Colour is never the only cue: give the category a name in `category`, which is read in the event's description.
- With `href` an event is a link (resolved through the components context); without, a button that calls `onEventSelect`.
- `loadRange(start, end, signal)` fetches the events for the visible range instead of passing them all; navigating aborts the previous request.

## Views

- **Agenda** is a heading per day that has events and a list of them. It is linear and accessible by construction, and it is the default below `sm`.
- **Month** is an APG grid. One day is a tab stop; the arrow keys move by day and week, Home and End to the week's ends, Page Up and Page Down by month. Each day is named by its full date and event count, and today is `aria-current="date"`. Enter moves into the day's events (arrow keys between them), Escape back to the day. A crowded day shows `maxPerDay` events and an "n more" button that opens the rest in a popover.

The heading names the month and is a polite live region, so moving to another month is announced. The week starts on the locale's first day (`Intl.Locale#getWeekInfo`) unless `weekStartsOn` says otherwise.

Week and day time grids are not built yet.
