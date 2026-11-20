<!-- @component
`EventCalendar`'s month: an APG grid of days with roving focus; Enter moves into a day's events, Escape back out. Internal.
-->
<script lang="ts">
  import type { CalendarDate } from '@internationalized/date';
  import { tick } from 'svelte';
  import CalendarDayEvents from './CalendarDayEvents.svelte';
  import type { CalendarEvent, PlacedEvent } from './events.ts';

  interface Props {
    weeks: readonly (readonly CalendarDate[])[];
    focused: CalendarDate;
    today: CalendarDate;
    /** The grid's name: the visible heading's id. */
    labelledBy: string;
    weekdays: readonly { readonly short: string; readonly long: string }[];
    eventsFor: (day: CalendarDate) => readonly PlacedEvent[];
    cellLabel: (day: CalendarDate, count: number) => string;
    maxPerDay: number;
    moreLabel: (count: number) => string;
    timeOf: (placed: PlacedEvent) => string;
    describe: (placed: PlacedEvent, day: CalendarDate) => string;
    onFocusDate: (day: CalendarDate) => void;
    onSelect: ((event: CalendarEvent) => void) | undefined;
  }

  let {
    weeks,
    focused,
    today,
    labelledBy,
    weekdays,
    eventsFor,
    cellLabel,
    maxPerDay,
    moreLabel,
    timeOf,
    describe,
    onFocusDate,
    onSelect,
  }: Props = $props();

  let grid: HTMLTableElement | undefined = $state();

  /** Each day's state, so the template only places it. */
  const cells = $derived(
    weeks.map((week) =>
      week.map((day) => {
        const events = eventsFor(day);
        return {
          day,
          key: day.toString(),
          number: day.day,
          events,
          label: cellLabel(day, events.length),
          focused: day.compare(focused) === 0,
          isToday: day.compare(today) === 0,
          outside: day.month !== focused.month,
        };
      }),
    ),
  );

  const cellOf = (day: CalendarDate): HTMLElement | null | undefined =>
    grid?.querySelector<HTMLElement>(`[data-date="${day.toString()}"]`);

  const moveTo = async (day: CalendarDate): Promise<void> => {
    onFocusDate(day);
    await tick();
    cellOf(day)?.focus();
  };

  /** Where each key takes the focused day. */
  const moves: Record<string, (day: CalendarDate) => CalendarDate> = {
    ArrowRight: (day) => day.add({ days: 1 }),
    ArrowLeft: (day) => day.subtract({ days: 1 }),
    ArrowDown: (day) => day.add({ weeks: 1 }),
    ArrowUp: (day) => day.subtract({ weeks: 1 }),
    PageDown: (day) => day.add({ months: 1 }),
    PageUp: (day) => day.subtract({ months: 1 }),
  };

  const weekEdge = (day: CalendarDate, end: boolean): CalendarDate => {
    const week = weeks.find((each) => each.some((entry) => entry.compare(day) === 0)) ?? [];
    return (end ? week.at(-1) : week[0]) ?? day;
  };

  const innerItems = (cell: HTMLElement): HTMLElement[] => [
    ...cell.querySelectorAll<HTMLElement>('[data-event], [data-more]'),
  ];

  const onCellKey = (event: KeyboardEvent & { currentTarget: HTMLElement }, day: CalendarDate): void => {
    const cell = event.currentTarget;
    if (event.target !== cell) {
      onItemKey(event, cell);
      return;
    }
    const move = moves[event.key];
    const target =
      move?.(day) ??
      (event.key === 'Home' ? weekEdge(day, false) : event.key === 'End' ? weekEdge(day, true) : undefined);
    if (target !== undefined) {
      event.preventDefault();
      void moveTo(target);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      innerItems(cell)[0]?.focus();
    }
  };

  const onItemKey = (event: KeyboardEvent, cell: HTMLElement): void => {
    const items = innerItems(cell);
    const index = items.indexOf(event.target as HTMLElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      cell.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      items[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
    }
  };
</script>

<table
  bind:this={grid}
  role="grid"
  aria-labelledby={labelledBy}
  class="w-full table-fixed border-collapse"
  style:table-layout="fixed"
  style:width="100%"
>
  <thead>
    <tr>
      {#each weekdays as weekday (weekday.long)}
        <th role="columnheader" scope="col" class="text-base-content/70 py-1 text-xs font-medium">
          <span aria-hidden="true">{weekday.short}</span>
          <span class="sr-only">{weekday.long}</span>
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each cells as week (week[0]?.key)}
      <tr>
        {#each week as cell (cell.key)}
          {@const day = cell.day}
          <td
            role="gridcell"
            data-date={day.toString()}
            tabindex={cell.focused ? 0 : -1}
            aria-label={cell.label}
            aria-current={cell.isToday ? 'date' : undefined}
            aria-selected={cell.focused}
            class={[
              'border-base-300 focus-visible:outline-primary h-24 border p-1 align-top focus-visible:outline-2 focus-visible:-outline-offset-2',
              cell.outside && 'bg-base-200/50 text-base-content/50',
            ]}
            onclick={(event) => {
              if (event.target === event.currentTarget) void moveTo(day);
            }}
            onkeydown={(event) => {
              onCellKey(event, day);
            }}
          >
            <CalendarDayEvents
              {day}
              number={cell.number}
              isToday={cell.isToday}
              events={cell.events}
              {maxPerDay}
              label={cell.label}
              {moreLabel}
              {timeOf}
              {describe}
              {onSelect}
            />
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
