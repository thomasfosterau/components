<!-- @component
A daisyUI `radial-progress` ring with its figure in the centre, as a progress bar (completion of a task) or a meter (a measurement).
-->
<!--
  RadialProgress — a styled `<div>`, since daisyUI's ring has no native
  element, so it carries the ARIA itself.

  ARIA contract: `role="progressbar"`, or `role="meter"` with
  `kind="meter"`, named by `label`, with `aria-valuemin`, `aria-valuemax`,
  `aria-valuenow` (clamped to the range) and `aria-valuetext` (the locale's
  percentage). A progress ring with no `value` is indeterminate: no
  `aria-valuenow`, and a spinning arc that stops under reduced motion. A
  meter always has a value. The centre figure, or `children`, is
  `aria-hidden`, so there is one accessible value.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { textTone, type Size, type Tone } from '../ui/tones.ts';
  import { radialSize } from './sizes.ts';

  interface Common extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Accessible name, e.g. `Upload` or `Soil moisture`. */
    label: string;
    /**
     * The value that means full.
     * @defaultValue `100`
     */
    max?: number | undefined;
    /**
     * Semantic colour of the ring.
     * @defaultValue `'primary'`
     */
    tone?: Tone | undefined;
    /**
     * Diameter step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** Locale(s) for the percentage. Defaults to the components context's. */
    locales?: string | readonly string[] | undefined;
    /** Replaces the centre figure; hidden from assistive technology. */
    children?: Snippet<[]> | undefined;
  }

  type Props = Common &
    (
      | {
          /**
           * What the number is: completion of a task, or a measurement.
           * @defaultValue `'progress'`
           */
          kind?: 'progress' | undefined;
          /** Current value in `[0, max]`. Omit for an indeterminate ring. */
          value?: number | undefined;
        }
      | {
          kind: 'meter';
          /** The measurement in `[0, max]`; a meter always has one. */
          value: number;
        }
    );

  let {
    label,
    value,
    max = 100,
    kind = 'progress',
    tone = 'primary',
    size = 'md',
    locales,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const clamped = $derived(value === undefined ? undefined : Math.min(max, Math.max(0, value)));
  const fraction = $derived(clamped === undefined || max <= 0 ? undefined : clamped / max);
  const percent = $derived(
    new Intl.NumberFormat(locales ?? context.locale(), {
      style: 'percent',
      maximumFractionDigits: 0,
    }),
  );
  const valueText = $derived(fraction === undefined ? undefined : percent.format(fraction));
</script>

<div
  {...rest}
  role={kind === 'meter' ? 'meter' : 'progressbar'}
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuenow={clamped}
  aria-valuetext={valueText}
  class={[
    'radial-progress',
    radialSize[size],
    textTone[tone],
    fraction === undefined && 'animate-spin motion-reduce:animate-none',
    className,
  ]}
  style:--value={fraction === undefined ? 25 : Math.round(fraction * 100)}
>
  <span aria-hidden="true">
    {#if children}{@render children()}{:else}{valueText ?? ''}{/if}
  </span>
</div>
