<!-- @component
Segmented day / month / year entry on bits-ui `DateField`, in the locale's order.
-->
<!--
  DateField — a date typed into segments (day, month, year; optionally hour
  and minute), each a `role="spinbutton"`: digits to type, ↑ / ↓ to step,
  ← / → and auto-advance between segments, Backspace to clear. The order
  and separators follow the locale (en-AU day/month/year, en-US
  month/day/year).

  `DateInput` (the native `<input type="date">`) stays the default for a
  single date on a form. Reach for this when a design needs the same
  control on every browser, or a time as well as a date.

  ARIA contract: see `SegmentGroup` — a `role="group"` named by the
  `FormField` label through `labelId`, `aria-describedby` its hint and
  errors, `aria-invalid` when in error. With `name`, bits-ui posts the ISO
  value (`2026-10-14`) through a hidden input.
-->
<script lang="ts">
  import type { DateValue } from '@internationalized/date';
  import { DateField } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import { definedProps } from './calendar-props.ts';
  import SegmentGroup from './SegmentGroup.svelte';
  import { segmentedField, type SegmentedFieldProps } from './segmented-field.ts';

  interface Props extends SegmentedFieldProps {
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
  }

  let {
    value = $bindable(),
    minValue,
    maxValue,
    granularity = 'day',
    ...shared
  }: Props = $props();

  const context = getComponentsContext();
  const field = $derived(segmentedField(shared, context.locale()));
</script>

<DateField.Root
  bind:value={() => value as DateValue, (next) => (value = next)}
  {...field.root}
  {...definedProps({ minValue, maxValue })}
  {granularity}
>
  <SegmentGroup parts={DateField} group={field.group} />
</DateField.Root>
