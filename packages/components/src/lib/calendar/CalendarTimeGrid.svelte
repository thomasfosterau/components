<!-- @component
`EventCalendar`'s week and day views: a presentational time grid over `hours`, an hour gutter, an all-day strip and a column per day. Internal.
-->
<script lang="ts">
  import type { CalendarDate } from '@internationalized/date';
  import CalendarTimeColumn from './CalendarTimeColumn.svelte';
  import {
    eventsOn,
    timedSegments,
    type CalendarEvent,
    type GridHours,
    type PlacedEvent,
  } from './events.ts';

  interface Props {
    days: readonly CalendarDate[];
    today: CalendarDate;
    placed: readonly PlacedEvent[];
    hours: GridHours;
    /** A day's visible heading and its full date. */
    dayNames: (day: CalendarDate) => { readonly short: string; readonly long: string };
    /** The gutter's label for an hour (0–23). */
    hourLabel: (hour: number) => string;
    allDayLabel: string;
    newEventLabel: (day: string) => string;
    timeOf: (placed: PlacedEvent) => string;
    nameOf: (placed: PlacedEvent) => string;
    describe: (placed: PlacedEvent, day: CalendarDate) => string;
    onSelect: ((event: CalendarEvent) => void) | undefined;
    onNew: ((day: CalendarDate) => void) | undefined;
    onDrag: ((day: CalendarDate, from: number, to: number) => void) | undefined;
  }

  let {
    days,
    today,
    placed,
    hours,
    dayNames,
    hourLabel,
    allDayLabel,
    newEventLabel,
    timeOf,
    nameOf,
    describe,
    onSelect,
    onNew,
    onDrag,
  }: Props = $props();

  const hourRem = 3;
  const height = $derived(`${(hours[1] - hours[0]) * hourRem}rem`);
  const gutter = $derived(
    Array.from({ length: hours[1] - hours[0] }, (_, index) => {
      const hour = hours[0] + index;
      return { hour, label: hourLabel(hour), top: `${index * hourRem}rem` };
    }),
  );

  /** Each day's state, so the template only places it. */
  const columns = $derived(
    days.map((day, index) => {
      const names = dayNames(day);
      return {
        day,
        key: day.toString(),
        names,
        column: index + 2,
        isToday: day.compare(today) === 0,
        allDay: eventsOn(placed, day).filter((each) => each.allDay),
        timed: timedSegments(placed, day, hours),
      };
    }),
  );
</script>

<div
  role="presentation"
  class="border-base-300 rounded border"
  style:display="grid"
  style:grid-template-columns={`3.5rem repeat(${days.length}, minmax(0, 1fr))`}
  style:grid-template-rows="auto auto auto"
>
  <div
    aria-hidden="true"
    class="text-base-content/60 border-base-300 border-b px-1 py-0.5 text-end text-xs"
    style:grid-column="1"
    style:grid-row="2"
  >
    {allDayLabel}
  </div>
  <div aria-hidden="true" style:grid-column="1" style:grid-row="3" style:position="relative" style:height>
    {#each gutter as entry (entry.hour)}
      <span
        class="text-base-content/60 px-1 text-xs tabular-nums"
        style:position="absolute"
        style:inset-inline-end="0"
        style:top={entry.top}>{entry.label}</span
      >
    {/each}
  </div>
  {#each columns as entry (entry.key)}
    <CalendarTimeColumn
      day={entry.day}
      shortName={entry.names.short}
      longName={entry.names.long}
      isToday={entry.isToday}
      allDay={entry.allDay}
      timed={entry.timed}
      {hours}
      {height}
      column={entry.column}
      {timeOf}
      {nameOf}
      {describe}
      newEventLabel={newEventLabel(entry.names.long)}
      {onSelect}
      onNew={onNew === undefined ? undefined : () => onNew(entry.day)}
      onDrag={onDrag === undefined ? undefined : (from, to) => onDrag(entry.day, from, to)}
    />
  {/each}
</div>
