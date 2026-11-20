<!-- @component
Dated events on a calendar: a month grid and an agenda list, with Today / Previous / Next and a view switch.
-->
<!--
  The agenda is a list of day headings and events, accessible by
  construction; the month is an APG grid with roving focus, Enter into a
  day's events and Escape back out. Events are concrete: recurrences are
  the caller's to expand. Week and day time grids are not built yet.
-->
<script lang="ts">
  import { getLocalTimeZone, parseDate, today, type CalendarDate } from '@internationalized/date';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import ToggleGroup from '../ui/ToggleGroup.svelte';
  import CalendarAgenda from './CalendarAgenda.svelte';
  import CalendarMonth from './CalendarMonth.svelte';
  import {
    eventsOn,
    localeWeekStart,
    monthWeeks,
    placeEvent,
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
     * @defaultValue `['month', 'agenda']`
     */
    views?: readonly CalendarView[] | undefined;
    /** Fetch the events for the visible range (ISO dates, inclusive); the signal aborts on navigation. */
    loadRange?:
      | ((start: string, end: string, signal: AbortSignal) => Promise<readonly CalendarEvent[]>)
      | undefined;
    /** An event without an `href` was chosen. */
    onEventSelect?: ((event: CalendarEvent) => void) | undefined;
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
     * The unit the buttons move by.
     * @defaultValue `'month'`
     */
    monthUnitLabel?: string | undefined;
    /**
     * The view switch's items.
     * @defaultValue `{ month: 'Month', agenda: 'Agenda' }`
     */
    viewLabels?: Readonly<Record<CalendarView, string>> | undefined;
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
    views = ['month', 'agenda'],
    loadRange,
    onEventSelect,
    weekStartsOn,
    timeZone: timeZoneProp,
    locales,
    maxPerDay = 3,
    todayLabel = 'Today',
    previousLabel = (unit) => `Previous ${unit}`,
    nextLabel = (unit) => `Next ${unit}`,
    monthUnitLabel = 'month',
    viewLabels = { month: 'Month', agenda: 'Agenda' },
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
  const heading = $derived(
    monthFormat.format(new Date(Date.UTC(focused.year, focused.month - 1, 15))),
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

  const viewItems = $derived(views.map((each) => ({ value: each, label: viewLabels[each] })));
</script>

<section {...rest} aria-labelledby={headingId} class={['flex flex-col gap-3', className]}>
  <header class="flex flex-wrap items-center gap-2">
    <h2 id={headingId} aria-live="polite" class="me-auto text-lg font-semibold">{heading}</h2>
    <button type="button" class="btn btn-sm" onclick={() => setDate(now)}>{todayLabel}</button>
    <div class="flex">
      <IconButtonCore
        label={previousLabel(monthUnitLabel)}
        size="sm"
        onclick={() => setDate(focused.subtract({ months: 1 }))}
      >
        {#snippet icon()}<ChevronLeft class="size-4 rtl:rotate-180" />{/snippet}
      </IconButtonCore>
      <IconButtonCore
        label={nextLabel(monthUnitLabel)}
        size="sm"
        onclick={() => setDate(focused.add({ months: 1 }))}
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
    {:else}
      <CalendarAgenda days={agendaDays} {timeOf} {describe} {noEventsLabel} onSelect={onEventSelect} />
    {/if}
  </div>
</section>
