<!-- @component
One daisyUI `stat`: a headline figure with its label and optional change line and description; wrap a row in `Stats`.
-->
<!--
  StatTile — one daisyUI `stat`: a headline figure with its label, an optional
  change line and an optional description. Wrap a row of them in `Stats`.

  ARIA contract: no roles, on purpose. A stat is text, and daisyUI's
  `stat-title` / `stat-value` / `stat-desc` order puts it in the reading order
  a reader expects — label, then figure, then the change. What the markup
  cannot convey is the DIRECTION of the change: the arrow that tells a sighted
  reader "up" is `aria-hidden`, so the direction is also spelled out in
  visually hidden text beside it, and the tone colour is never the only
  carrier.

  Numbers are formatted through `Intl` for the context's locale; pass a
  pre-formatted string for anything that is not a plain count.
-->
<script lang="ts">
  import { Minus, TrendingDown, TrendingUp } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  /** The change line a `StatTile` shows under its value: a signed amount, how to render it, and trailing words. */
  export interface StatDelta {
    /**
     * The change. Positive is up. With `unit: 'percent'` it is read as a
     * percentage — `3.2` renders as `+3.2%`.
     */
    readonly value: number;
    /**
     * How to render it: a whole count, a percentage, or a decimal whose unit
     * the caller names in `label` (`'pts swing'`).
     */
    readonly unit?: 'count' | 'percent' | 'points' | undefined;
    /** Trailing words, e.g. `swing` or `since April`. */
    readonly label?: string | undefined;
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The `stat-title`. */
    label: string;
    /** The headline figure; a number is formatted as a count. */
    value: string | number;
    /** Change line under the value. */
    delta?: StatDelta | undefined;
    /** Plain description, rendered after the delta when both are present. */
    description?: string | undefined;
    /**
     * Announced in place of the rising arrow.
     * @defaultValue `'Up'`
     */
    upLabel?: string | undefined;
    /**
     * Announced in place of the falling arrow.
     * @defaultValue `'Down'`
     */
    downLabel?: string | undefined;
    /**
     * Announced in place of the flat marker.
     * @defaultValue `'No change'`
     */
    flatLabel?: string | undefined;
    /** Locale(s) for the figures. Defaults to the components context's. */
    locales?: string | readonly string[] | undefined;
    /** Icon or sparkline in the `stat-figure` slot. */
    figure?: Snippet<[]> | undefined;
  }

  let {
    label,
    value,
    delta,
    description,
    upLabel = 'Up',
    downLabel = 'Down',
    flatLabel = 'No change',
    locales,
    figure,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
  const chosenLocales = $derived(locales ?? context.locale());

  const countFormat = $derived(new Intl.NumberFormat(chosenLocales));
  const signedCount = $derived(
    new Intl.NumberFormat(chosenLocales, { signDisplay: 'exceptZero', maximumFractionDigits: 0 }),
  );
  const signedDecimal = $derived(
    new Intl.NumberFormat(chosenLocales, { signDisplay: 'exceptZero', maximumFractionDigits: 1 }),
  );
  const signedPercent = $derived(
    new Intl.NumberFormat(chosenLocales, {
      style: 'percent',
      signDisplay: 'exceptZero',
      maximumFractionDigits: 1,
    }),
  );

  const formattedValue = $derived(typeof value === 'number' ? countFormat.format(value) : value);

  const deltaText = $derived.by(() => {
    if (delta === undefined) return '';
    const unit = delta.unit ?? 'count';
    const number =
      unit === 'count'
        ? signedCount.format(delta.value)
        : unit === 'percent'
          ? signedPercent.format(delta.value / 100)
          : signedDecimal.format(delta.value);
    return delta.label === undefined ? number : `${number} ${delta.label}`;
  });

  const direction = $derived(
    delta === undefined || delta.value === 0 ? 'flat' : delta.value > 0 ? 'up' : 'down',
  );

  const deltaClass: Record<'up' | 'down' | 'flat', string> = {
    up: 'text-success',
    down: 'text-error',
    flat: 'text-base-content/70',
  };
</script>

<div {...rest} class={['stat', className]}>
  {#if figure}
    <div class="stat-figure">{@render figure()}</div>
  {/if}
  <div class="stat-title">{label}</div>
  <div class="stat-value tabular-nums">{formattedValue}</div>
  {#if delta !== undefined}
    <div class={['stat-desc flex items-center gap-1 tabular-nums', deltaClass[direction]]}>
      {#if direction === 'up'}
        <TrendingUp class="size-4" aria-hidden="true" />
        <span class="sr-only">{upLabel}</span>
      {:else if direction === 'down'}
        <TrendingDown class="size-4" aria-hidden="true" />
        <span class="sr-only">{downLabel}</span>
      {:else}
        <Minus class="size-4" aria-hidden="true" />
        <span class="sr-only">{flatLabel}</span>
      {/if}
      <span>{deltaText}</span>
    </div>
  {/if}
  {#if description !== undefined}
    <div class="stat-desc">{description}</div>
  {/if}
</div>
