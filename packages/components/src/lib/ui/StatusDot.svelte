<!-- @component
daisyUI's `status` dot for a state, always with a text `label` that says the same thing (visible or screen-reader only).
-->
<!--
  StatusDot — a small coloured dot for a state (sync healthy, sensor
  offline, watering due).

  ARIA contract: a dot is colour alone (WCAG 1.4.1), so `label` is required
  and is real text in flow — visible with `showLabel`, `sr-only` otherwise —
  and the dot itself is `aria-hidden`. "Sensor 3 Offline" is read wherever
  the dot sits. No `role="status"`: a dot is a state, not an announcement;
  a caller who needs a CHANGE announced owns that live region. An unread dot
  with no label is a bug this component exists to make impossible.

  `pulse` is daisyUI's documented ping: a second dot behind the first with
  `animate-ping`, switched off under `prefers-reduced-motion: reduce`.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { statusSize, statusTone, type Size, type Tone } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** What the dot means, e.g. `'Offline'`. Required: a dot alone is colour alone. */
    label: string;
    /**
     * Print `label` beside the dot instead of only for screen readers.
     * @defaultValue `false`
     */
    showLabel?: boolean | undefined;
    /**
     * Semantic colour.
     * @defaultValue `'neutral'`
     */
    tone?: Tone | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * Ping for a live or attention state; never under reduced motion.
     * @defaultValue `false`
     */
    pulse?: boolean | undefined;
  }

  let {
    label,
    showLabel = false,
    tone = 'neutral',
    size = 'md',
    pulse = false,
    class: className,
    ...rest
  }: Props = $props();

  const dot = $derived(['status', statusTone[tone], statusSize[size]]);
</script>

<span {...rest} class={['inline-flex items-center gap-2', className]}>
  <span aria-hidden="true" class="inline-grid *:[grid-area:1/1]">
    {#if pulse}
      <span class={[...dot, 'animate-ping motion-reduce:animate-none']}></span>
    {/if}
    <span class={dot}></span>
  </span>
  <span class={showLabel ? undefined : 'sr-only'}>{label}</span>
</span>
