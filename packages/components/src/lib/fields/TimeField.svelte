<!-- @component
Segmented hour / minute entry on bits-ui `TimeField`, with the locale's or a forced 12/24-hour clock.
-->
<!--
  TimeField — a time of day typed into segments (hour, minute, optionally
  second, and AM/PM on a 12-hour clock), each a `role="spinbutton"`. The
  clock follows the locale unless `hourCycle` forces 12 or 24, so the
  control no longer depends on what the browser's native time input does.

  ARIA contract: see `SegmentGroup`. With `name`, bits-ui posts the ISO
  time (`14:30:00`) through a hidden input.
-->
<script lang="ts">
  import type { Time } from '@internationalized/date';
  import { TimeField } from 'bits-ui';
  import { getComponentsContext } from '../context.svelte.ts';
  import { definedProps } from './calendar-props.ts';
  import SegmentGroup from './SegmentGroup.svelte';
  import { segmentedField, type SegmentedFieldProps, type TimeValue } from './segmented-field.ts';

  interface Props extends SegmentedFieldProps {
    /** The time; `undefined` while empty or incomplete. Bindable. */
    value?: TimeValue | undefined;
    /** Earliest valid time. */
    minValue?: TimeValue | undefined;
    /** Latest valid time. */
    maxValue?: TimeValue | undefined;
    /**
     * The smallest segment shown.
     * @defaultValue `'minute'`
     */
    granularity?: 'hour' | 'minute' | 'second' | undefined;
  }

  let {
    value = $bindable(),
    minValue,
    maxValue,
    granularity = 'minute',
    ...shared
  }: Props = $props();

  const context = getComponentsContext();
  const field = $derived(segmentedField(shared, context.locale()));
</script>

<TimeField.Root
  bind:value={() => value as Time, (next) => (value = next)}
  {...field.root}
  {...definedProps({ minValue, maxValue })}
  {granularity}
>
  <SegmentGroup parts={TimeField} group={field.group} />
</TimeField.Root>
