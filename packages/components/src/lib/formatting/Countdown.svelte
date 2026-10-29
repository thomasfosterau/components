<!-- @component
The time left until an instant, ticking every second in daisyUI's `countdown` digits, read out coarsely and announced once at zero.
-->
<!--
  Countdown — a seed-swap opening, an auction close, a watering timer.

  ARIA contract (the part that matters): a `role="timer"` named by `label`.
  A second-by-second announcement is unusable, so the ticking digits are
  `aria-hidden`, and what assistive technology reads is a separate
  visually hidden text at a coarse granularity that changes far less often:
  whole minutes under an hour ("4 minutes"), whole hours above it ("2
  days, 4 hours"). The granularity is fixed, not a prop. `role="timer"` is
  implicitly `aria-live="off"`, so even that is read on demand, not pushed.
  At zero a polite `role="status"` announces `completeLabel` once. With
  `prefers-reduced-motion: reduce` the digit roll does not animate
  (WCAG 2.2.2).

  The clock starts in an `$effect`, never at module load (`sideEffects:
  false`), and stops on destroy or at zero. The first render uses the
  current time, and the client re-syncs after mount. An `until` already in
  the past renders the complete state without calling `onComplete`: that
  only fires when the countdown is seen reaching zero.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { formatDuration, type DurationValue } from './duration.ts';

  /** The largest unit a `Countdown` shows. */
  type CountdownUnit = 'days' | 'hours' | 'minutes';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** The instant counted down to: a `Date`, epoch milliseconds or an ISO string. */
    until: Date | number | string;
    /** Accessible name and visible lead-in, e.g. `'Seed swap opens in'`. */
    label: string;
    /**
     * Largest unit shown; larger amounts fold into it (50 hours with `'hours'`).
     * @defaultValue `'days'`
     */
    largestUnit?: CountdownUnit | undefined;
    /**
     * daisyUI digit roll, or formatted text.
     * @defaultValue `'digits'`
     */
    display?: 'digits' | 'text' | undefined;
    /**
     * Announced once at zero.
     * @defaultValue `'Time is up'`
     */
    completeLabel?: string | undefined;
    /** Called once when the countdown is seen reaching zero. */
    onComplete?: (() => void) | undefined;
    /**
     * Locale(s) for the unit words.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    until,
    label,
    largestUnit = 'days',
    display = 'digits',
    completeLabel = 'Time is up',
    onComplete,
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const SIZES: Record<CountdownUnit | 'seconds', number> = {
    days: DAY,
    hours: HOUR,
    minutes: MINUTE,
    seconds: SECOND,
  };
  const ORDER = ['days', 'hours', 'minutes', 'seconds'] as const;

  let now = $state(Date.now());
  const target = $derived(new Date(until).getTime());
  const remaining = $derived(Math.max(0, target - now));
  const complete = $derived(remaining === 0);

  /** The units shown, from `largestUnit` down to seconds, each with its count. */
  const parts = $derived.by(() => {
    let rest = Math.ceil(remaining / SECOND) * SECOND;
    return ORDER.slice(ORDER.indexOf(largestUnit)).map((unit) => {
      const count = Math.floor(rest / SIZES[unit]);
      rest -= count * SIZES[unit];
      return { unit, count };
    });
  });

  /** The spoken, coarse rendering: minutes under an hour, hours above. */
  const spoken = $derived.by((): string => {
    if (remaining >= HOUR) {
      const days = Math.floor(remaining / DAY);
      const hours = Math.floor((remaining % DAY) / HOUR);
      const value: DurationValue = days > 0 ? { days, hours } : { hours };
      return formatDuration(value, locales, 'long');
    }
    return formatDuration({ minutes: Math.ceil(remaining / MINUTE) }, locales, 'long');
  });

  const text = $derived(
    formatDuration(Object.fromEntries(parts.map(({ unit, count }) => [unit, count])), locales, 'short'),
  );

  /** The narrow unit label after each digit group ("d", "h", "m", "s" in English). */
  const unitLabel = (unit: (typeof ORDER)[number], count: number): string =>
    new Intl.NumberFormat(locales as string | string[] | undefined, {
      style: 'unit',
      unit: unit.slice(0, -1),
      unitDisplay: 'narrow',
    })
      .formatToParts(count)
      .filter((part) => part.type === 'unit')
      .map((part) => part.value)
      .join('');

  $effect(() => {
    now = Date.now();
    if (target <= now) return;
    let done = false;
    const timer = setInterval(() => {
      now = Date.now();
      if (!done && now >= target) {
        done = true;
        clearInterval(timer);
        onComplete?.();
      }
    }, SECOND);
    return () => clearInterval(timer);
  });
</script>

<span {...rest} role="timer" aria-label={label} class={['inline-flex flex-wrap items-baseline gap-2', className]}>
  <span aria-hidden="true">{label}</span>
  <span aria-hidden="true" class="inline-flex items-baseline gap-1 font-mono tabular-nums">
    {#if display === 'digits'}
      {#each parts as { unit, count } (unit)}
        <span class="countdown motion-reduce:*:before:transition-none"
          ><span style:--value={count} style:--digits={unit === largestUnit ? undefined : 2}>{count}</span></span
        >{unitLabel(unit, count)}
      {/each}
    {:else}
      {text}
    {/if}
  </span>
  <span class="sr-only">{complete ? '' : spoken}</span>
  <span role="status" class="sr-only">{complete ? completeLabel : ''}</span>
</span>
