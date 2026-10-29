<!-- @component
The header, month grids and day cells `Calendar` and `RangeCalendar` share; internal, not exported.
-->
<!--
  CalendarMonths — the body of a bits-ui calendar, written once for both
  roots. `parts` is the bits-ui namespace in use (`Calendar` or
  `RangeCalendar`); both expose the same sub-components with the same props,
  so one template serves both, and the day styling — the part a reader sees
  — cannot drift between the single-date and the range calendar.

  Each month `<table role="grid">` is named by its own month and year
  ("October 2026"), so a two-month calendar's grids are told apart. The
  visible heading is bits-ui's, `aria-hidden` because the month is already
  in the `application`'s name, which bits-ui updates as the reader pages. An unavailable day is struck through as well as
  `aria-disabled`: colour is never the only signal.
-->
<script lang="ts">
  import { DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { Calendar, RangeCalendar } from 'bits-ui';
  import type { Snippet } from 'svelte';

  /** One month of the calendar, as bits-ui's root snippet hands it over. */
  interface Month {
    readonly value: DateValue;
    readonly weeks: readonly (readonly DateValue[])[];
  }

  /** What the `day` snippet receives for one cell. */
  interface DayState {
    readonly date: DateValue;
    readonly selected: boolean;
    readonly unavailable: boolean;
  }

  interface Props {
    /** The bits-ui namespace whose parts to render. */
    parts: typeof Calendar | typeof RangeCalendar;
    months: readonly Month[];
    weekdays: readonly string[];
    /** The resolved single locale. */
    locale: string;
    previousLabel: string;
    nextLabel: string;
    /** Extra decoration inside a day cell. */
    day?: Snippet<[DayState]> | undefined;
  }

  let { parts, months, weekdays, locale, previousLabel, nextLabel, day }: Props = $props();

  const P = $derived(parts as typeof Calendar);
  const monthName = $derived(new DateFormatter(locale, { month: 'long', year: 'numeric' }));
  const nameOf = (month: Month): string => monthName.format(month.value.toDate(getLocalTimeZone()));

  // One literal class list (Tailwind scans it as written). Range-middle wins
  // over selected, so a range reads as one band with two solid ends.
  const dayClass = [
    'btn btn-ghost btn-sm btn-square font-normal',
    'data-today:ring-1 data-today:ring-primary data-today:ring-inset',
    '[&[data-selected]:not([data-range-middle])]:bg-primary [&[data-selected]:not([data-range-middle])]:text-primary-content',
    'data-range-middle:bg-primary/15 data-range-middle:rounded-none',
    'data-outside-month:text-base-content/40',
    'data-unavailable:text-base-content/40 data-unavailable:line-through',
    'data-disabled:text-base-content/30 data-disabled:pointer-events-none',
  ];
</script>

<P.Header class="flex items-center justify-between gap-2 pb-2">
  <!-- bits-ui writes its own English aria-label after the caller's props, so
       the button is rendered through `child` to put `previousLabel` last. -->
  <P.PrevButton>
    {#snippet child({ props })}
      <button {...props} class="btn btn-ghost btn-sm btn-square" aria-label={previousLabel}>
        <ChevronLeft class="size-4" aria-hidden="true" />
      </button>
    {/snippet}
  </P.PrevButton>
  <P.Heading class="text-sm font-medium" />
  <P.NextButton>
    {#snippet child({ props })}
      <button {...props} class="btn btn-ghost btn-sm btn-square" aria-label={nextLabel}>
        <ChevronRight class="size-4" aria-hidden="true" />
      </button>
    {/snippet}
  </P.NextButton>
</P.Header>
<div class="flex flex-col gap-4 sm:flex-row">
  {#each months as month (month.value.toString())}
    <P.Grid class="w-full border-collapse select-none" aria-label={nameOf(month)}>
      <P.GridHead>
        <P.GridRow class="flex">
          {#each weekdays as weekday, index (index)}
            <P.HeadCell class="text-base-content/60 w-8 text-xs font-normal">{weekday}</P.HeadCell>
          {/each}
        </P.GridRow>
      </P.GridHead>
      <P.GridBody>
        {#each month.weeks as week, index (index)}
          <P.GridRow class="flex">
            {#each week as date (date.toString())}
              <P.Cell {date} month={month.value} class="p-0">
                {#snippet children({ selected, unavailable })}
                  <P.Day class={dayClass}>
                    {date.day}
                    {#if day}{@render day({ date, selected, unavailable })}{/if}
                  </P.Day>
                {/snippet}
              </P.Cell>
            {/each}
          </P.GridRow>
        {/each}
      </P.GridBody>
    </P.Grid>
  {/each}
</div>
