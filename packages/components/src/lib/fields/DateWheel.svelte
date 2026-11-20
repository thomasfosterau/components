<!-- @component
A date on scrolling wheels (day | month | year in the locale's order): a touch-first alternative to `DateField`.
-->
<script lang="ts">
  import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
  import type { ComponentProps } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import WheelPicker from './WheelPicker.svelte';
  import type { WheelValue } from './wheel.ts';
  import {
    dateToWheel,
    dateWheel,
    defaultWheelDateLabels,
    wheelToDate,
    type WheelDateLabels,
  } from './wheel-dates.ts';

  interface Props
    extends Omit<
      ComponentProps<typeof WheelPicker>,
      'columns' | 'value' | 'separators' | 'serialize' | 'onValueChange'
    > {
    /** The date; shows today (within range) while `undefined`. Bindable. */
    value?: CalendarDate | undefined;
    /** Earliest date. @defaultValue 1 January, 100 years ago */
    minValue?: CalendarDate | undefined;
    /** Latest date. @defaultValue 31 December, 10 years ahead */
    maxValue?: CalendarDate | undefined;
    /** Formatting locale(s); the components context's by default. */
    locales?: Intl.LocalesArgument | undefined;
    /** Column names; `day`, `month` and `year` are read. */
    labels?: Partial<WheelDateLabels> | undefined;
    /** Called with each committed date. */
    onValueChange?: ((value: CalendarDate) => void) | undefined;
  }

  let {
    value = $bindable(),
    minValue,
    maxValue,
    locales,
    labels,
    onValueChange,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const locale = $derived((locales ?? context.locale()) as Intl.LocalesArgument);
  const now = today(getLocalTimeZone());
  const min = $derived(minValue ?? new CalendarDate(now.year - 100, 1, 1));
  const max = $derived(maxValue ?? new CalendarDate(now.year + 10, 12, 31));
  const shown = $derived(
    wheelToDate(dateToWheel(value ?? new CalendarDate(now.year, now.month, now.day)), min, max),
  );
  const layout = $derived(
    dateWheel({
      locales: locale,
      min,
      max,
      date: shown,
      labels: { ...defaultWheelDateLabels, ...labels },
    }),
  );

  const change = (next: WheelValue): void => {
    const date = wheelToDate(next, min, max);
    value = date;
    onValueChange?.(date);
  };
</script>

<WheelPicker
  {...rest}
  columns={layout.columns}
  separators={layout.separators}
  value={dateToWheel(shown)}
  serialize={(next) => wheelToDate(next, min, max).toString()}
  onValueChange={change}
/>
