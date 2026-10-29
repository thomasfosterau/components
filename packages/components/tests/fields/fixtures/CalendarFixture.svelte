<script lang="ts">
  import { parseDate, type DateValue } from '@internationalized/date';
  import Calendar from '../../../src/lib/fields/Calendar.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import RangeCalendar from '../../../src/lib/fields/RangeCalendar.svelte';
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';

  interface Props {
    range?: boolean | undefined;
    value?: string | undefined;
    minValue?: string | undefined;
    unavailable?: readonly string[] | undefined;
    locales?: string | undefined;
    contextLocale?: string | undefined;
    minDays?: number | undefined;
    numberOfMonths?: number | undefined;
  }

  let {
    range = false,
    value: initial,
    minValue,
    unavailable = [],
    locales,
    contextLocale,
    minDays,
    numberOfMonths,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  if (contextLocale !== undefined) setComponentsContext({ locale: () => contextLocale });

  // svelte-ignore state_referenced_locally
  let single = $state<DateValue | undefined>(initial === undefined ? undefined : parseDate(initial));
  let span = $state<{ start: DateValue | undefined; end: DateValue | undefined } | undefined>();

  const isDateUnavailable = (date: DateValue): boolean => unavailable.includes(date.toString());
  const min = $derived(minValue === undefined ? undefined : parseDate(minValue));
  // A fixed month in view, so the tests do not depend on today's date.
  let month = $state<DateValue>(parseDate('2026-10-01'));
</script>

<FormField label="Sown on" hint="Pick the day the seeds went in.">
  {#snippet children(control)}
    {#if range}
      <RangeCalendar
        {...control}
        bind:value={span}
        {isDateUnavailable}
        minValue={min}
        {locales}
        {minDays}
        {numberOfMonths}
        bind:month
      />
    {:else}
      <Calendar
        {...control}
        bind:value={single}
        {isDateUnavailable}
        minValue={min}
        {locales}
        {numberOfMonths}
        bind:month
      />
    {/if}
  {/snippet}
</FormField>
<p data-testid="bound">
  {range ? `${span?.start?.toString() ?? ''}..${span?.end?.toString() ?? ''}` : (single?.toString() ?? '')}
</p>
