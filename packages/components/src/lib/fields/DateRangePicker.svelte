<!-- @component
Two segmented date fields, a start and an end, with a range-calendar popover, on bits-ui `DateRangePicker`.
-->
<!--
  DateRangePicker — a start and an end date typed into segments, or picked
  as a span on a `RangeCalendar` in a popover. `minDays` / `maxDays`
  constrain the span while it is chosen.

  ARIA contract: the whole control is one `role="group"` named by the
  `FormField` label (`labelId`) and described by its hint and errors, so
  the error text reaches it (a written-out `group` does not take
  `aria-invalid`; `invalid` draws the error border). Inside it, the two halves are groups named
  `startLabel` / `endLabel`, so a segment reads "day, <label> Start date".
  The dash between them is `aria-hidden`. The trigger and dialog are
  `PickerPopover`'s.
-->
<script lang="ts">
  import type { DateValue } from '@internationalized/date';
  import { DateRangePicker } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import { definedProps } from './calendar-props.ts';
  import { inputSize } from './field-types.ts';
  import PickerPopover from './PickerPopover.svelte';
  import SegmentGroup from './SegmentGroup.svelte';
  import { pickerField, type PickerProps, type SegmentedFieldProps } from './segmented-field.ts';

  /** A start–end span; either end `undefined` while incomplete. */
  interface DateRangeValue {
    start: DateValue | undefined;
    end: DateValue | undefined;
  }

  interface Props extends Omit<SegmentedFieldProps, 'name'>, PickerProps {
    /** The span. Bindable. */
    value?: DateRangeValue | undefined;
    /** Earliest valid date. */
    minValue?: DateValue | undefined;
    /** Latest valid date. */
    maxValue?: DateValue | undefined;
    /** Shortest span in days. */
    minDays?: number | undefined;
    /** Longest span in days. */
    maxDays?: number | undefined;
    /**
     * Close the popover once the span is complete.
     * @defaultValue `true`
     */
    closeOnRangeSelect?: boolean | undefined;
    /** Form field name of the start date (ISO), posted through a hidden input. */
    startName?: string | undefined;
    /** Form field name of the end date (ISO), posted through a hidden input. */
    endName?: string | undefined;
    /**
     * Name of the start half.
     * @defaultValue `'Start date'`
     */
    startLabel?: string | undefined;
    /**
     * Name of the end half.
     * @defaultValue `'End date'`
     */
    endLabel?: string | undefined;
  }

  let {
    value = $bindable(),
    open = $bindable(false),
    minValue,
    maxValue,
    minDays,
    maxDays,
    closeOnRangeSelect = true,
    startName,
    endName,
    startLabel = 'Start date',
    endLabel = 'End date',
    ...shared
  }: Props = $props();

  const context = getComponentsContext();
  const picker = $derived(pickerField(shared, context.locale()));
  const group = $derived(picker.group);
  const { class: className, ...attributes } = $derived(group.attributes);
</script>

<DateRangePicker.Root
  bind:value={
    () => value ?? { start: undefined, end: undefined },
    (next) => (value = { start: next.start, end: next.end })
  }
  bind:open
  {...picker.root}
  {...definedProps({ minValue, maxValue, minDays, maxDays })}
  {closeOnRangeSelect}
>
  {#snippet child({ props })}
    <div
      {...attributes}
      {...props}
      {...group.id === undefined ? {} : { id: group.id }}
      role="group"
      aria-labelledby={group.labelId}
      aria-describedby={group.describedBy === '' ? undefined : group.describedBy}
      class={[
        'input inline-flex w-auto items-center gap-0 tabular-nums',
        inputSize[group.size],
        group.invalid && 'input-error',
        'data-invalid:input-error',
        group.disabled && 'opacity-50',
        className,
      ]}
    >
      <SegmentGroup parts={DateRangePicker} {group} range={{ type: 'start', label: startLabel, name: startName }} />
      <span aria-hidden="true" class="text-base-content/60 px-1.5">–</span>
      <SegmentGroup parts={DateRangePicker} {group} range={{ type: 'end', label: endLabel, name: endName }} />
      <PickerPopover
        parts={DateRangePicker}
        triggerLabel={picker.triggerLabel}
        calendarLabel={picker.calendarLabel}
        months={picker.months}
        disabled={group.disabled}
      />
    </div>
  {/snippet}
</DateRangePicker.Root>
