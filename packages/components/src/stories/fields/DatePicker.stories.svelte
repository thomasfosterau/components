<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { parseDate, type DateValue } from '@internationalized/date';
  import DatePicker from '../../lib/fields/DatePicker.svelte';
  import DateRangePicker from '../../lib/fields/DateRangePicker.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/DatePicker',
    component: DatePicker,
    parameters: {
      docs: {
        description: {
          component:
            'A segmented date field with a "Choose date" button that opens the month in a popover; `DateRangePicker` does the same for a start–end span. From `@thomasfosterau/components/dates`.',
        },
      },
    },
  });

  // Weekends unavailable, for the booking story.
  const weekend = (date: DateValue): boolean => {
    const day = date.toDate('UTC').getUTCDay();
    return day === 0 || day === 6;
  };
</script>

<Story name="Date picker">
  <FormField label="Sown on" hint="Type it, or choose it on the calendar.">
    {#snippet children(control)}<DatePicker {...control} locales="en-AU" name="sown" />{/snippet}
  </FormField>
</Story>

<Story name="Unavailable days">
  <FormField label="Delivery day">
    {#snippet children(control)}
      <DatePicker {...control} locales="en-AU" value={parseDate('2026-10-14')} isDateUnavailable={weekend} />
    {/snippet}
  </FormField>
</Story>

<Story name="Date range picker">
  <FormField label="Season">
    {#snippet children(control)}
      <DateRangePicker {...control} locales="en-AU" minDays={3} numberOfMonths={2} startName="from" endName="to" />
    {/snippet}
  </FormField>
</Story>
