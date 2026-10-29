<!-- @component
A segmented date field with a button that opens a calendar popover, on bits-ui `DatePicker`.
-->
<!--
  DatePicker — `DateField`'s segments plus a calendar button: type the date,
  or open the month and pick it. Selecting a day closes the popover
  (`closeOnDateSelect`) and returns focus to the button.

  Reach for it when the reader benefits from seeing the month (which day
  of the week, what is unavailable); for a plain date on a form the
  native `DateInput` remains the default.

  ARIA contract: the segment group as `DateField` (named by the
  `FormField` label through `labelId`); the trigger and dialog as
  `PickerPopover`; the grid as `Calendar`.
-->
<script lang="ts">
  import type { DateValue } from '@internationalized/date';
  import { DatePicker } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import { definedProps } from './calendar-props.ts';
  import PickerPopover from './PickerPopover.svelte';
  import SegmentGroup from './SegmentGroup.svelte';
  import { pickerField, type PickerProps, type SegmentedFieldProps } from './segmented-field.ts';

  interface Props extends SegmentedFieldProps, PickerProps {
    /** The date; `undefined` while empty or incomplete. Bindable. */
    value?: DateValue | undefined;
    /** Earliest valid date. */
    minValue?: DateValue | undefined;
    /** Latest valid date. */
    maxValue?: DateValue | undefined;
    /**
     * The smallest segment shown.
     * @defaultValue `'day'`
     */
    granularity?: 'day' | 'hour' | 'minute' | 'second' | undefined;
    /**
     * Close the popover when a day is picked.
     * @defaultValue `true`
     */
    closeOnDateSelect?: boolean | undefined;
  }

  let {
    value = $bindable(),
    open = $bindable(false),
    minValue,
    maxValue,
    granularity = 'day',
    closeOnDateSelect = true,
    ...shared
  }: Props = $props();

  const context = getComponentsContext();
  const picker = $derived(pickerField(shared, context.locale()));

</script>

<DatePicker.Root
  bind:value={() => value as DateValue, (next) => (value = next)}
  bind:open
  {...picker.root}
  {...definedProps({ minValue, maxValue })}
  {granularity}
  {closeOnDateSelect}
>
  <SegmentGroup parts={DatePicker} group={picker.group}>
    {#snippet trailing()}
      <PickerPopover
        parts={DatePicker}
        triggerLabel={picker.triggerLabel}
        calendarLabel={picker.calendarLabel}
        months={picker.months}
        disabled={picker.group.disabled}
      />
    {/snippet}
  </SegmentGroup>
</DatePicker.Root>
