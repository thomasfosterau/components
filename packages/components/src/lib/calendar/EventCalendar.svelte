<!-- @component
Dated events on a calendar: a month grid, week and day time grids and an agenda list, with Today / Previous / Next and a view switch.
-->
<!--
  The agenda is a list of day headings and events, accessible by
  construction; the month is an APG grid with roving focus, Enter into a
  day's events and Escape back out. The week and day time grids position
  events by time but keep them in time order in the DOM, so Tab follows
  the clock. Events are concrete: recurrences are the caller's to expand.
-->
<script lang="ts">
  import {
    getLocalTimeZone,
    now as nowIn,
    parseDate,
    today,
    type CalendarDate,
  } from '@internationalized/date';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import ToggleGroup from '../ui/ToggleGroup.svelte';
  import CalendarAgenda from './CalendarAgenda.svelte';
  import CalendarMonth from './CalendarMonth.svelte';
  import CalendarTimeGrid from './CalendarTimeGrid.svelte';
  import {
    defaultSlot,
    eventsOn,
    gridDays,
    gridHours,
    localeWeekStart,
    monthWeeks,
    placeEvent,
    slotBetween,
    visibleRange,
    type CalendarEvent,
    type CalendarView,
    type PlacedEvent,
  } from './events.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The events, when not loaded through `loadRange`. */
    events?: readonly CalendarEvent[] | undefined;
    /**
     * The view. Bindable.
     * @defaultValue `'month'`, or `'agenda'` below `sm`
     */
    view?: CalendarView | undefined;
    /**
     * The focused date, ISO (`2026-10-23`). Bindable.
     * @defaultValue today
     */
    date?: string | undefined;
    /**
     * The views the switch offers.
     * @defaultValue `['month', 'week', 'day', 'agenda']`
     */
    views?: readonly CalendarView[] | undefined;
    /** Fetch the events for the visible range (ISO dates, inclusive); the signal aborts on navigation. */
    loadRange?:
      | ((start: string, end: string, signal: AbortSignal) => Promise<readonly CalendarEvent[]>)
      | undefined;
    /** An event without an `href` was chosen. */
    onEventSelect?: ((event: CalendarEvent) => void) | undefined;
    /**
     * A time slot was chosen in the week or day view, by dragging over the
     * hours or a day's "New event" button: ISO 8601 instants with the
     * offset. Without it, the grid offers neither.
     */
    onSlotSelect?: ((start: string, end: string) => void) | undefined;
    /**
     * The week and day views' first and last hours, 0–24.
     * @defaultValue `[6, 22]`
     */
    hours?: readonly [from: number, to: number] | undefined;
    /**
     * The minutes a dragged slot snaps to.
     * @defaultValue `30`
     */
    slotMinutes?: number | undefined;
    /**
     * The first day of the week, 0 Sunday … 6 Saturday.
     * @defaultValue the locale's
     */
    weekStartsOn?: 0 | 1 | 6 | undefined;
    /**
     * The time zone events are shown in.
     * @defaultValue the browser's
     */
    timeZone?: string | undefined;
    /** Formatting locale(s); defaults to the components context's. */
    locales?: Intl.LocalesArgument | undefined;
    /**
     * Events shown in a month cell before "n more".
     * @defaultValue `3`
     */
    maxPerDay?: number | undefined;
    /** @defaultValue `'Today'` */
    todayLabel?: string | undefined;
    /**
     * The Previous button, given the unit ("month").
     * @defaultValue `` (unit) => `Previous ${unit}` ``
     */
    previousLabel?: ((unit: string) => string) | undefined;
    /**
     * The Next button, given the unit.
     * @defaultValue `` (unit) => `Next ${unit}` ``
     */
    nextLabel?: ((unit: string) => string) | undefined;
    /**
     * The unit the buttons move by in the month and agenda views.
     * @defaultValue `'month'`
     */
    monthUnitLabel?: string | undefined;
    /**
     * The unit the buttons move by in the week view.
     * @defaultValue `'week'`
     */
    weekUnitLabel?: string | undefined;
    /**
     * The unit the buttons move by in the day view.
     * @defaultValue `'day'`
     */
    dayUnitLabel?: string | undefined;
    /**
     * The view switch's items; any left out keep their default.
     * @defaultValue `{ month: 'Month', week: 'Week', day: 'Day', agenda: 'Agenda' }`
     */
    viewLabels?: Readonly<Partial<Record<CalendarView, string>>> | undefined;
    /**
     * A day's "New event" button in the week and day views, given the date.
     * @defaultValue `` (day) => `New event, ${day}` ``
     */
    newEventLabel?: ((day: string) => string) | undefined;
    /**
     * Names the view switch.
     * @defaultValue `'View'`
     */
    viewSwitchLabel?: string | undefined;
    /**
     * A crowded month cell's button.
     * @defaultValue `` (n) => `${n} more` ``
     */
    moreLabel?: ((count: number) => string) | undefined;
    /**
     * A day cell's event count.
     * @defaultValue `` (n) => n === 1 ? '1 event' : `${n} events` ``
     */
    eventCountLabel?: ((count: number) => string) | undefined;
    /** @defaultValue `'all day'` */
    allDayLabel?: string | undefined;
    /** @defaultValue `'No events'` */
    noEventsLabel?: string | undefined;
  }

  let {
    events = [],
    view = $bindable(),
    date = $bindable(),
    views = ['month', 'week', 'day', 'agenda'],
    loadRange,
    onEventSelect,
    onSlotSelect,
    hours: hoursProp,
    slotMinutes = 30,
    weekStartsOn,
    timeZone: timeZoneProp,
    locales,
    maxPerDay = 3,
    todayLabel = 'Today',
    previousLabel = (unit) => `Previous ${unit}`,
    nextLabel = (unit) => `Next ${unit}`,
    monthUnitLabel = 'month',
    weekUnitLabel = 'week',
    dayUnitLabel = 'day',
    viewLabels,
    newEventLabel = (day) => `New event, ${day}`,
    viewSwitchLabel = 'View',
    moreLabel = (count) => `${count} more`,
    eventCountLabel = (count) => (count === 1 ? '1 event' : `${count} events`),
    allDayLabel = 'all day',
    noEventsLabel = 'No events',
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const uid = $props.id();
  const headingId = `${uid}-heading`;

  const timeZone = $derived(timeZoneProp ?? getLocalTimeZone());
  const locale = $derived(
    new Intl.DateTimeFormat((locales ?? context.locale()) as Intl.LocalesArgument).resolvedOptions()
      .locale,
  );
  const firstDay = $derived(weekStartsOn ?? localeWeekStart(locale));
  const now = $derived(today(timeZone));
  const focused = $derived.by(() => {
    try {
      return date === undefined ? now : parseDate(date);
    } catch {
      return now;
    }
  });

  let narrow = $state(false);
  onMount(() => {
    narrow = !globalThis.matchMedia?.('(min-width: 640px)').matches;
  });
  const current = $derived<CalendarView>(view ?? (narrow ? 'agenda' : 'month'));

  const setDate = (day: CalendarDate): void => {
    date = day.toString();
  };

  const range = $derived(visibleRange(current, focused, firstDay));
  let loaded: readonly CalendarEvent[] = $state.raw([]);
  let loading = $state(false);

  $effect(() => {
    if (loadRange === undefined) return;
    const controller = new AbortController();
    const fetch = loadRange;
    loading = true;
    void (async () => {
      try {
        const found = await fetch(range.start.toString(), range.end.toString(), controller.signal);
        if (!controller.signal.aborted) loaded = found;
      } catch {
        // A failed or aborted load keeps the events already shown.
      }
      if (!controller.signal.aborted) loading = false;
    })();
    return () => {
      controller.abort();
    };
  });

  const placed = $derived(
    (loadRange === undefined ? events : loaded).flatMap((event) => {
      const each = placeEvent(event, timeZone);
      return each === undefined ? [] : [each];
    }),
  );

  const monthFormat = $derived(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }));
  const dayFormat = $derived(
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
  );
  const fullDayFormat = $derived(
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  );
  const shortDayFormat = $derived(
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }),
  );
  const timeFormat = $derived(
    new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }),
  );

  const asDate = (day: CalendarDate): Date => day.toDate('UTC');
  const rangeFormat = $derived(
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  );
  const heading = $derived.by(() => {
    if (current === 'week') return rangeFormat.formatRange(asDate(range.start), asDate(range.end));
    if (current === 'day') return fullDayFormat.format(asDate(focused));
    return monthFormat.format(new Date(Date.UTC(focused.year, focused.month - 1, 15)));
  });

  /** What Previous and Next move by in each view, and the unit their names give. */
  const step = $derived(
    current === 'week'
      ? { duration: { weeks: 1 }, unit: weekUnitLabel }
      : current === 'day'
        ? { duration: { days: 1 }, unit: dayUnitLabel }
        : { duration: { months: 1 }, unit: monthUnitLabel },
  );

  const timeOf = (each: PlacedEvent): string =>
    each.startsAt === undefined ? '' : timeFormat.format(each.startsAt.toDate());

  const describe = (each: PlacedEvent, day: CalendarDate): string => {
    const when =
      each.startsAt === undefined || each.endsAt === undefined
        ? allDayLabel
        : timeFormat.formatRange(each.startsAt.toDate(), each.endsAt.toDate());
    return [
      `${shortDayFormat.format(asDate(day))}, ${when}`,
      each.event.category,
      each.event.description,
    ]
      .filter((part) => part !== undefined && part !== '')
      .join('. ');
  };

  const weeks = $derived(monthWeeks(focused, firstDay));
  const weekdays = $derived(
    (weeks[0] ?? []).map((day) => ({
      short: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(asDate(day)),
      long: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(asDate(day)),
    })),
  );

  const agendaDays = $derived.by(() => {
    const days = [];
    for (let day = range.start; day.compare(range.end) <= 0; day = day.add({ days: 1 })) {
      const onDay = eventsOn(placed, day);
      if (onDay.length > 0) days.push({ day, heading: dayFormat.format(asDate(day)), events: onDay });
    }
    return days;
  });

  const defaultViewLabels: Record<CalendarView, string> = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
  };
  const viewItems = $derived(
    views.map((each) => ({ value: each, label: viewLabels?.[each] ?? defaultViewLabels[each] })),
  );

  const hours = $derived(gridHours(hoursProp));
  const hourFormat = $derived(new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' }));
  const shortWeekdayFormat = $derived(
    new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', timeZone: 'UTC' }),
  );

  const nameOf = (each: PlacedEvent): string =>
    each.startsAt === undefined || each.endsAt === undefined
      ? `${each.event.title}, ${allDayLabel}`
      : `${each.event.title}, ${timeFormat.formatRange(each.startsAt.toDate(), each.endsAt.toDate())}`;

  const selectSlot = (slot: { readonly start: string; readonly end: string }): void => {
    onSlotSelect?.(slot.start, slot.end);
  };
</script>

<section {...rest} aria-labelledby={headingId} class={['flex flex-col gap-3', className]}>
  <header class="flex flex-wrap items-center gap-2">
    <h2 id={headingId} aria-live="polite" class="me-auto text-lg font-semibold">{heading}</h2>
    <button type="button" class="btn btn-sm" onclick={() => setDate(now)}>{todayLabel}</button>
    <div class="flex">
      <IconButtonCore
        label={previousLabel(step.unit)}
        size="sm"
        onclick={() => setDate(focused.subtract(step.duration))}
      >
        {#snippet icon()}<ChevronLeft class="size-4 rtl:rotate-180" />{/snippet}
      </IconButtonCore>
      <IconButtonCore
        label={nextLabel(step.unit)}
        size="sm"
        onclick={() => setDate(focused.add(step.duration))}
      >
        {#snippet icon()}<ChevronRight class="size-4 rtl:rotate-180" />{/snippet}
      </IconButtonCore>
    </div>
    {#if viewItems.length > 1}
      <ToggleGroup
        type="single"
        items={viewItems}
        label={viewSwitchLabel}
        size="sm"
        variant="outline"
        value={current}
        onValueChange={(next) => {
          if (next !== '') view = next;
        }}
      />
    {/if}
  </header>
  <div aria-busy={loading ? 'true' : undefined}>
    {#if current === 'month'}
      <CalendarMonth
        {weeks}
        {focused}
        today={now}
        labelledBy={headingId}
        {weekdays}
        eventsFor={(day) => eventsOn(placed, day)}
        cellLabel={(day, count) => `${fullDayFormat.format(asDate(day))}, ${eventCountLabel(count)}`}
        {maxPerDay}
        {moreLabel}
        {timeOf}
        {describe}
        onFocusDate={setDate}
        onSelect={onEventSelect}
      />
    {:else if current === 'week' || current === 'day'}
      <CalendarTimeGrid
        days={gridDays(current, focused, firstDay)}
        today={now}
        {placed}
        {hours}
        dayNames={(day) => ({
          short: shortWeekdayFormat.format(asDate(day)),
          long: fullDayFormat.format(asDate(day)),
        })}
        hourLabel={(hour) => hourFormat.format(new Date(Date.UTC(2000, 0, 1, hour)))}
        {allDayLabel}
        {newEventLabel}
        {timeOf}
        {nameOf}
        {describe}
        onSelect={onEventSelect}
        onNew={onSlotSelect === undefined
          ? undefined
          : (day) => selectSlot(defaultSlot(day, hours, nowIn(timeZone), timeZone))}
        onDrag={onSlotSelect === undefined
          ? undefined
          : (day, from, to) => selectSlot(slotBetween(day, from, to, hours, slotMinutes, timeZone))}
      />
    {:else}
      <CalendarAgenda days={agendaDays} {timeOf} {describe} {noEventsLabel} onSelect={onEventSelect} />
    {/if}
  </div>
</section>
