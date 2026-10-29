<!-- @component
An inline, always-visible month grid for picking a start–end date range, on bits-ui's `RangeCalendar`.
-->
<!--
  RangeCalendar — `Calendar`'s range sibling: the first chosen day starts
  the range, the second ends it, and the days between are drawn as one band.
  `minDays` / `maxDays` bound the length; `excludeDisabled` decides whether a
  range may run across disabled days. It shares everything else — props,
  header, grids, day styling — with `Calendar` (`calendar-props.ts`,
  `CalendarMonths.svelte`), so the ARIA contract is the same: see
  `Calendar`'s header. bits-ui adds `data-range-start` / `-middle` / `-end`
  to the days, which is all the band styling reads.

  The value is `{ start, end }` of `DateValue`s, either side `undefined`
  while the reader is still choosing.
-->
<script lang="ts">
  import type { DateValue } from '@internationalized/date';
  import { RangeCalendar } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import CalendarMonths from './CalendarMonths.svelte';
  import { calendarRoot, definedProps, type CalendarBaseProps } from './calendar-props.ts';

  interface Props extends CalendarBaseProps {
    /** `{ start, end }`; either side `undefined` while choosing. Bindable. */
    value?: { start: DateValue | undefined; end: DateValue | undefined } | undefined;
    /** Shortest allowed range, in days. */
    minDays?: number | undefined;
    /** Longest allowed range, in days. */
    maxDays?: number | undefined;
    /**
     * Refuse a range that would span a disabled day.
     * @defaultValue `false`
     */
    excludeDisabled?: boolean | undefined;
  }

  let {
    value = $bindable(),
    month = $bindable(),
    minDays,
    maxDays,
    excludeDisabled = false,
    ...props
  }: Props = $props();

  const context = getComponentsContext();
  const shared = $derived(calendarRoot(props, context.locale()));
  const lengths = $derived(definedProps({ minDays, maxDays }));
</script>

<RangeCalendar.Root
  {...shared.root}
  {...lengths}
  {excludeDisabled}
  bind:placeholder={
    // Unset, bits-ui picks the value's month or today's.
    () => month as DateValue,
    (next: DateValue) => {
      month = next;
    }
  }
  bind:value={
    () => value ?? { start: undefined, end: undefined },
    (next) => {
      value = next;
    }
  }
>
  {#snippet children({ months, weekdays })}
    <CalendarMonths parts={RangeCalendar} {...shared.months} {months} {weekdays} />
  {/snippet}
</RangeCalendar.Root>
