<!-- @component
An indeterminate loading indicator in daisyUI's `loading` shapes, named for assistive technology unless it is decorative.
-->
<!--
  Spinner — "something is happening, and there is no shape to preview": a
  panel waiting on a fetch, a lazy section, an inline "Checking…". When the
  content's shape is known, `Skeleton` is the better placeholder.

  ARIA contract, mirroring `Skeleton`'s on purpose: the wrapper is
  `role="status"` (a polite live region, so its appearance is announced)
  named by `aria-label={label}` — `status` does not take its name from its
  content — and the animated shape is `aria-hidden`. With `showLabel` the
  visible text is `aria-hidden` too, so the label is announced once.

  `decorative` is for a spinner whose meaning something else already
  carries — `Button`'s `aria-busy`, a live region around it — and renders the
  shape alone, `aria-hidden`, with no role. Never nest a non-decorative
  spinner inside another live region: two regions announce twice.

  Motion: daisyUI's `loading` already slows its animation under
  `prefers-reduced-motion: reduce` rather than stopping it — a frozen spinner
  reads as "hung" (WCAG 2.3.3) — so nothing is added here.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { loadingSize, loadingVariant, textTone, type Size, type SpinnerVariant, type Tone } from './tones.ts';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /**
     * The daisyUI `loading` shape.
     * @defaultValue `'spinner'`
     */
    variant?: SpinnerVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** Colour, through `textTone`; inherits `currentColor` when omitted. */
    tone?: Tone | undefined;
    /**
     * What assistive technology announces.
     * @defaultValue `'Loading'`
     */
    label?: string | undefined;
    /**
     * Print `label` beside the spinner.
     * @defaultValue `false`
     */
    showLabel?: boolean | undefined;
    /**
     * Something else already says it is loading: render the shape only, `aria-hidden`, with no role.
     * @defaultValue `false`
     */
    decorative?: boolean | undefined;
  }

  let {
    variant = 'spinner',
    size = 'md',
    tone,
    label = 'Loading',
    showLabel = false,
    decorative = false,
    class: className,
    ...rest
  }: Props = $props();

  const shape = $derived(['loading', loadingVariant[variant], loadingSize[size], tone !== undefined && textTone[tone]]);
</script>

{#if decorative}
  <span {...rest} aria-hidden="true" class={[shape, className]}></span>
{:else}
  <span {...rest} role="status" aria-label={label} class={['inline-flex items-center gap-2', className]}>
    <span aria-hidden="true" class={shape}></span>
    {#if showLabel}<span aria-hidden="true">{label}</span>{/if}
  </span>
{/if}
