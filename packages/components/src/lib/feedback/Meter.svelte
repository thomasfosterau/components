<!-- @component
A measurement within a known range (soil moisture, storage used) on a native `<meter>`, with `low`, `high` and `optimum` thresholds.
-->
<!--
  Meter — a gauge of a quantity, where `ProgressBar` is the completion of a
  task. Screen readers announce the two differently: a `<progress>` for
  "storage used" tells a reader something is loading.

  Native `<meter>` rather than bits-ui's `Meter`, which is a `div
  role="meter"` with no thresholds: the element carries the role, the value
  and the platform's good, fair and poor states from `low`, `high` and
  `optimum`. daisyUI has no `meter` class, so the bar's pseudo-elements are
  styled here in the success, warning and error tokens.

  ARIA contract: `label` is the accessible name; `aria-valuetext` is
  `valueText` or the locale's percentage. Colour is never the only sign of
  a threshold: say it in `valueText` or show the figure. The printed figure
  is `aria-hidden`, as in `ProgressBar`.
-->
<script lang="ts">
  import type { HTMLMeterAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props
    extends Omit<HTMLMeterAttributes, 'value' | 'min' | 'max' | 'low' | 'high' | 'optimum'> {
    /** Accessible name, e.g. `Soil moisture`. */
    label: string;
    /** The measurement, in `[min, max]`. */
    value: number;
    /**
     * @defaultValue `0`
     */
    min?: number | undefined;
    /**
     * @defaultValue `1`
     */
    max?: number | undefined;
    /** Upper bound of the low range. */
    low?: number | undefined;
    /** Lower bound of the high range. */
    high?: number | undefined;
    /** The preferred value; decides whether the low or the high range is good. */
    optimum?: number | undefined;
    /** What a screen reader hears, e.g. `'7.2 GB of 10 GB'`; the locale's percentage when omitted. */
    valueText?: string | undefined;
    /** Print `valueText` beside the bar. */
    showValue?: boolean | undefined;
    /** Locale(s) for the percentage. Defaults to the components context's. */
    locales?: string | readonly string[] | undefined;
    /** Extra classes on the wrapper. */
    class?: string | undefined;
  }

  let {
    label,
    value,
    min = 0,
    max = 1,
    low,
    high,
    optimum,
    valueText: valueTextProp,
    showValue = false,
    locales,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const clamped = $derived(Math.min(max, Math.max(min, value)));
  const percent = $derived(
    new Intl.NumberFormat(locales ?? context.locale(), {
      style: 'percent',
      maximumFractionDigits: 1,
    }),
  );
  const valueText = $derived(
    valueTextProp ?? (max > min ? percent.format((clamped - min) / (max - min)) : ''),
  );
</script>

<div class={['flex items-center gap-3', className]}>
  <meter
    {...rest}
    value={clamped}
    {min}
    {max}
    {low}
    {high}
    {optimum}
    aria-label={label}
    aria-valuetext={valueText}
    class={[
      'bg-base-300 h-2 w-full rounded-full',
      '[&::-webkit-meter-bar]:bg-base-300 [&::-webkit-meter-bar]:h-2 [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:border-0',
      '[&::-webkit-meter-optimum-value]:bg-success [&::-webkit-meter-suboptimum-value]:bg-warning [&::-webkit-meter-even-less-good-value]:bg-error [&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-suboptimum-value]:rounded-full [&::-webkit-meter-even-less-good-value]:rounded-full',
      '[&::-moz-meter-bar]:rounded-full [&:-moz-meter-optimum::-moz-meter-bar]:bg-success [&:-moz-meter-sub-optimum::-moz-meter-bar]:bg-warning [&:-moz-meter-sub-sub-optimum::-moz-meter-bar]:bg-error',
    ]}
  ></meter>
  {#if showValue && valueText !== ''}
    <span class="shrink-0 text-right text-sm tabular-nums" aria-hidden="true">{valueText}</span>
  {/if}
</div>
