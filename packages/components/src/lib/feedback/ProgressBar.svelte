<!-- @component
A native `<progress>` in a daisyUI tone.
-->
<!--
  ProgressBar — a native `<progress>` in a daisyUI tone.

  Native rather than a `div role="progressbar"`: the element already carries
  the role, the value semantics and the platform's own indeterminate
  rendering, and no hand-rolled version gets the indeterminate state right.

  ARIA contract: `label` is the accessible name (a `<progress>` takes no name
  from its contents), and `aria-valuetext` carries the percentage as words so
  a reader hears "62 per cent" rather than "62 of 100". Omitting `value`
  leaves the element indeterminate — no value attribute at all, which is what
  makes the platform animate it — and drops `aria-valuetext` with it. The
  printed percentage beside the bar is `aria-hidden`, because it restates the
  name and value the element already exposes.
-->
<script lang="ts">
  import type { HTMLProgressAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { progressTone, type Tone } from '../ui/tones.ts';

  interface Props extends Omit<HTMLProgressAttributes, 'value' | 'max'> {
    /** Accessible name, e.g. `Seeds germinated`. */
    label: string;
    /** Current value in `[0, max]`. Omit for an indeterminate bar. */
    value?: number | undefined;
    /**
     * The value that means complete.
     * @defaultValue `100`
     */
    max?: number | undefined;
    /**
     * Semantic colour.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /** Print the percentage beside the bar. */
    showValue?: boolean | undefined;
    /** Locale(s) for the percentage. Defaults to the components context's. */
    locales?: string | readonly string[] | undefined;
    /** Extra classes on the wrapper. */
    class?: string | undefined;
  }

  let {
    label,
    value,
    max = 100,
    tone = 'primary',
    showValue = false,
    locales,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const fraction = $derived(
    value === undefined || max <= 0 ? undefined : Math.min(1, Math.max(0, value / max)),
  );

  // The formatter is built in one `$derived` and applied in another: building
  // an `Intl` formatter is the expensive half, and it must not be redone every
  // time the value ticks.
  const percent = $derived(
    new Intl.NumberFormat(locales ?? context.locale(), {
      style: 'percent',
      maximumFractionDigits: 1,
    }),
  );
  const valueText = $derived(fraction === undefined ? undefined : percent.format(fraction));
</script>

<div class={['flex items-center gap-3', className]}>
  <progress
    {...rest}
    class={['progress', progressTone[tone]]}
    value={value === undefined ? undefined : Math.min(max, Math.max(0, value))}
    {max}
    aria-label={label}
    aria-valuetext={valueText}
  ></progress>
  {#if showValue && valueText !== undefined}
    <span class="w-14 shrink-0 text-right text-sm tabular-nums" aria-hidden="true">{valueText}</span>
  {/if}
</div>
