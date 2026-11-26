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
- **Week** and **Day** are time grids over `hours` (`[6, 22]` by default), with all-day events in a strip above them. The grid is presentational: each day is a section headed by its date, and its events are positioned by time but listed in time order, so Tab follows the clock. Each event is named by its title and time ("Watering roster, 9:00–10:30 am"). Overlapping events are packed into side-by-side columns (FullCalendar's algorithm), so none hides another.
- **Month** is an APG grid. One day is a tab stop; the arrow keys move by day and week, Home and End to the week's ends, Page Up and Page Down by month. Each day is named by its full date and event count, and today is `aria-current="date"`. Enter moves into the day's events (arrow keys between them), Escape back to the day. A crowded day shows `maxPerDay` events and an "n more" button that opens the rest in a popover.

The heading names the visible month, week range or day and is a polite live region, so moving is announced. Previous and Next move by the view's unit and name it ("Previous week"). The week starts on the locale's first day (`Intl.Locale#getWeekInfo`) unless `weekStartsOn` says otherwise.

## Creating events

With `onSlotSelect(start, end)`, the week and day views offer a time slot: drag over a day's hours (snapped to `slotMinutes`, 30 by default), or press the day's "New event" button, the keyboard path, which offers an hour from the next whole hour today or from the first hour on another day. `start` and `end` are ISO 8601 instants with the offset (`2026-10-23T09:00:00+11:00`), ready to become a `CalendarEvent`'s. Opening a form for the new event is the app's.

Moving and resizing events by dragging is not built yet.
