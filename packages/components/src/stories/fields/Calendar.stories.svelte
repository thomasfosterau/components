<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { parseDate, type DateValue } from '@internationalized/date';
  import Calendar from '../../lib/fields/Calendar.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import RangeCalendar from '../../lib/fields/RangeCalendar.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Calendar',
    component: Calendar,
    parameters: {
      docs: {
        description: {
          component:
            'Inline month grids on bits-ui, from `@thomasfosterau/components/dates`: `Calendar` for one date, `RangeCalendar` for a start–end range. Arrows move by day and week, Page Up / Page Down by month, Enter selects. Unavailable days are struck through as well as disabled.',
        },
      },
    },
  });

  const frosts = new Set(['2026-10-06', '2026-10-07', '2026-10-20']);
  const isFrost = (date: DateValue): boolean => frosts.has(date.toString());
  const planted = new Set(['2026-10-02', '2026-10-15', '2026-10-28']);
</script>

<Story name="Single date">
  <FormField label="Sown on" hint="Pick the day the seeds went in.">
    {#snippet children(control)}
      <Calendar {...control} value={parseDate('2026-10-15')} locales="en-AU" />
    {/snippet}
  </FormField>
</Story>

<Story name="Two months">
  <FormField label="Sown on">
    {#snippet children(control)}
      <Calendar {...control} month={parseDate('2026-10-01')} numberOfMonths={2} locales="en-AU" />
    {/snippet}
  </FormField>
</Story>

<Story name="Unavailable days and decorations">
  <FormField label="Planting day" hint="Struck-through days have a frost forecast.">
    {#snippet children(control)}
      <Calendar {...control} month={parseDate('2026-10-01')} isDateUnavailable={isFrost} locales="en-AU">
        {#snippet day({ date })}
          {#if planted.has(date.toString())}
            <span class="bg-success absolute bottom-1 size-1 rounded-full" aria-hidden="true"></span>
          {/if}
        {/snippet}
      </Calendar>
    {/snippet}
  </FormField>
</Story>

<Story name="Range">
  <FormField label="Holiday" hint="At least three nights.">
    {#snippet children(control)}
      <RangeCalendar
        {...control}
        value={{ start: parseDate('2026-10-12'), end: parseDate('2026-10-16') }}
        minDays={3}
        numberOfMonths={2}
        locales="en-AU"
      />
    {/snippet}
  </FormField>
</Story>
