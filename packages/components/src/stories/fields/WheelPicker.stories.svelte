<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CalendarDate, Time } from '@internationalized/date';
  import DateWheel from '../../lib/fields/DateWheel.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import TimeWheel from '../../lib/fields/TimeWheel.svelte';
  import WheelPicker from '../../lib/fields/WheelPicker.svelte';
  import type { WheelColumnDef } from '../../lib/fields/wheel.ts';

  const { Story } = defineMeta({
    title: 'Fields/WheelPicker',
    component: WheelPicker,
    parameters: {
      docs: {
        description: {
          component:
            'Scrolling wheel columns for a compact multi-part value, touch-first: flick and the column snaps. Each column is a spinbutton, so ↑/↓, Page Up/Down, Home/End and typing work, and a screen reader hears "Hours, 7". `TimeWheel` and `DateWheel` (from `@thomasfosterau/components/dates`) build their columns in the locale\'s order; they are alternatives to `TimeField` and `DateField`, not replacements.',
        },
      },
    },
  });

  const quantity: WheelColumnDef[] = [
    {
      id: 'amount',
      label: 'Amount',
      options: Array.from({ length: 20 }, (_, index) => ({
        value: String(index + 1),
        label: String(index + 1),
      })),
    },
    {
      id: 'unit',
      label: 'Unit',
      options: [
        { value: 'g', label: 'g' },
        { value: 'kg', label: 'kg' },
        { value: 't', label: 't', disabled: true },
        { value: 'bunch', label: 'bunches' },
      ],
    },
  ];
</script>

<Story name="Quantity and unit">
  {#snippet template()}
    <FormField label="Harvest" hint="Tonnes are disabled: no bed yields that much.">
      {#snippet children(control)}
        <WheelPicker {...control} columns={quantity} value={{ amount: '3', unit: 'kg' }} name="harvest" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Time, locale clock">
  {#snippet template()}
    <FormField label="Water at">
      {#snippet children(control)}
        <TimeWheel {...control} value={new Time(18, 30)} minuteStep={5} locales="en-US" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Time, 24-hour, three rows">
  {#snippet template()}
    <FormField label="Water at">
      {#snippet children(control)}
        <TimeWheel {...control} hourCycle={24} visibleRows={3} locales="en-AU" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Date in a range">
  {#snippet template()}
    <FormField label="Sown on" hint="This season only.">
      {#snippet children(control)}
        <DateWheel
          {...control}
          value={new CalendarDate(2026, 10, 14)}
          minValue={new CalendarDate(2026, 9, 1)}
          maxValue={new CalendarDate(2027, 2, 28)}
          locales="en-AU"
        />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <WheelPicker label="Harvest" columns={quantity} disabled />
  {/snippet}
</Story>
