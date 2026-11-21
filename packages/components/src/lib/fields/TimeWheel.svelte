<!-- @component
A time of day on scrolling wheels (hours | minutes | AM/PM), in the locale's order and hour cycle: a touch-first alternative to `TimeField`.
-->
<script lang="ts">
  import type { Time } from '@internationalized/date';
  import type { ComponentProps } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import WheelPicker from './WheelPicker.svelte';
  import type { WheelValue } from './wheel.ts';
  import {
    defaultWheelDateLabels,
    timeToWheel,
    timeWheel,
    usesTwelveHours,
    wheelToTime,
    type WheelDateLabels,
  } from './wheel-dates.ts';

  interface Props
    extends Omit<
      ComponentProps<typeof WheelPicker>,
      'columns' | 'value' | 'separators' | 'serialize' | 'onValueChange'
    > {
    /** The time; shows midnight while `undefined`. Bindable. */
    value?: Time | undefined;
    /** Formatting locale(s); the components context's by default. */
    locales?: Intl.LocalesArgument | undefined;
    /** Forces a 12- or 24-hour clock; the locale's otherwise. */
    hourCycle?: 12 | 24 | undefined;
    /**
     * Minutes between rows.
     * @defaultValue `1`
     */
    minuteStep?: number | undefined;
    /** Column names; `hour`, `minute` and `dayPeriod` are read. */
    labels?: Partial<WheelDateLabels> | undefined;
    /** Called with each committed time. */
    onValueChange?: ((value: Time) => void) | undefined;
  }

  let {
    value = $bindable(),
    locales,
    hourCycle,
    minuteStep = 1,
    labels,
    onValueChange,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const locale = $derived((locales ?? context.locale()) as Intl.LocalesArgument);
  const twelve = $derived(usesTwelveHours(locale, hourCycle));
  const layout = $derived(
    timeWheel({
      locales: locale,
      hourCycle,
      minuteStep,
      labels: { ...defaultWheelDateLabels, ...labels },
    }),
  );
  const wheel = $derived(value === undefined ? undefined : timeToWheel(value, twelve, minuteStep));

  const change = (next: WheelValue): void => {
    const time = wheelToTime(next);
    value = time;
    onValueChange?.(time);
  };
</script>

<WheelPicker
  {...rest}
  columns={layout.columns}
  separators={layout.separators}
  value={wheel}
  serialize={(next) => wheelToTime(next).toString()}
  onValueChange={change}
/>
