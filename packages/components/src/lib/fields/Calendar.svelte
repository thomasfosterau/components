<!-- @component
An inline, always-visible month grid for picking a date, on bits-ui's `Calendar`.
-->
<!--
  Calendar — a month (or several side by side) to choose one date from,
  inline rather than in a popover: a booking sidebar, a "sown on" planner, an
  availability view. The popover pickers compose it. `DateInput` (the native
  control) stays the default for a single date on a form; this is for when
  the reader benefits from seeing the month.

  The value is a `DateValue` from `@internationalized/date`, bits-ui's own
  type: lossless, and it carries its calendar system. Convert at the edge with
  `parseDate('2026-10-23')` and `value.toString()`, both re-exported from the
  `./dates` entry.

  ARIA contract (APG date-picker grid), from bits-ui: a `role="application"`
  wrapper named by `calendarLabel` and the visible month, one `role="grid"`
  per month, `gridcell`s with `aria-selected` / `aria-disabled`, a roving
  tabindex, and the keys — arrows by day and week, Home / End to the week's
  ends, Page Up / Page Down by month, Enter / Space to select. This file
  adds the labelled previous / next buttons (`previousLabel` / `nextLabel`),
  each grid's name ("October 2026"), a struck-through
  unavailable day, and the `FieldControl` wiring: inside a `FormField` the
  root is `aria-labelledby` the label (`labelId`) and `aria-describedby` the
  hint and errors. `invalid` draws the error border; the `application` role
  does not take `aria-invalid`, so the error text reaches it through
  `describedBy`.
-->
<script lang="ts">
  import type { DateValue } from '@internationalized/date';
  import { Calendar } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import CalendarMonths from './CalendarMonths.svelte';
  import { calendarRoot, type CalendarBaseProps } from './calendar-props.ts';

  interface Props extends CalendarBaseProps {
    /** The selected date; `undefined` when none. Bindable. */
    value?: DateValue | undefined;
  }

  let { value = $bindable(), month = $bindable(), ...props }: Props = $props();

  const context = getComponentsContext();
  const shared = $derived(calendarRoot(props, context.locale()));
</script>

<Calendar.Root
  {...shared.root}
  type="single"
  bind:placeholder={
    // Unset, bits-ui picks the value's month or today's.
    () => month as DateValue,
    (next: DateValue) => {
      month = next;
    }
  }
  bind:value={
    // bits-ui declares `value?: DateValue` (no `| undefined`) but reads an
    // unset value as `undefined` at runtime; the binding passes it through.
    () => value as DateValue,
    (next: DateValue | undefined) => {
      value = next;
    }
  }
>
  {#snippet children({ months, weekdays })}
    <CalendarMonths parts={Calendar} {...shared.months} {months} {weekdays} />
  {/snippet}
</Calendar.Root>
