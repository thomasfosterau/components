<!-- @component
The time since an instant, counting up every second ("12:04", "3 min"), read out coarsely; `stoppedAt` freezes it and `accumulated` carries earlier runs for pause and resume.
-->
<!--
  ElapsedTime — `Countdown`'s inverse: "watering for 12:04", "running for
  3 min". It reuses `Countdown`'s live-region policy unchanged.

  ARIA contract: a `role="timer"` named by `label` (implicitly
  `aria-live="off"`, so nothing is pushed). The ticking digits are
  `aria-hidden`; assistive technology reads a separate visually hidden
  rendering at a coarse, fixed granularity — `lessThanMinuteLabel` under a
  minute, whole minutes under an hour ("4 minutes"), hours and minutes above
  ("2 hours, 5 minutes").

  Pause and resume without hidden state: the elapsed time is
  `accumulated + ((stoppedAt ?? now) − since)`. A running timer passes
  `since`; pausing passes `stoppedAt`; resuming moves the time run so far
  into `accumulated` and passes a new `since`. Everything is a prop, so the
  server renders the same thing the client does. The clock ticks in an
  `$effect` (never at module load) and only while `stoppedAt` is unset.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { formatDuration, type DurationValue } from './duration.ts';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** When the current run started: a `Date`, epoch milliseconds or an ISO string. */
    since: Date | number | string;
    /** Accessible name and visible lead-in, e.g. `'Watering for'`. */
    label: string;
    /** Freeze the timer at this instant (paused or finished). Unset, it keeps counting. */
    stoppedAt?: Date | number | string | undefined;
    /**
     * Milliseconds from earlier runs, added to the current one (pause and resume).
     * @defaultValue `0`
     */
    accumulated?: number | undefined;
    /**
     * `'digital'` ("12:04", "1:02:03") or `'text'` ("12 min", "1 hr, 2 min").
     * @defaultValue `'digital'`
     */
    display?: 'digital' | 'text' | undefined;
    /**
     * Read under a minute, in place of a seconds count.
     * @defaultValue `'Less than a minute'`
     */
    lessThanMinuteLabel?: string | undefined;
    /**
     * Locale(s) for the digits and unit words.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    since,
    label,
    stoppedAt,
    accumulated = 0,
    display = 'digital',
    lessThanMinuteLabel = 'Less than a minute',
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;

  let now = $state(Date.now());
  const start = $derived(new Date(since).getTime());
  const stop = $derived(stoppedAt === undefined ? undefined : new Date(stoppedAt).getTime());
  const elapsed = $derived(Math.max(0, accumulated + ((stop ?? now) - start)));

  const hours = $derived(Math.floor(elapsed / HOUR));
  const minutes = $derived(Math.floor((elapsed % HOUR) / MINUTE));
  const seconds = $derived(Math.floor((elapsed % MINUTE) / SECOND));

  const tags = $derived(typeof locales === 'object' ? [...locales] : locales);
  const two = $derived(new Intl.NumberFormat(tags, { minimumIntegerDigits: 2, useGrouping: false }));
  const one = $derived(new Intl.NumberFormat(tags, { useGrouping: false }));

  const shown = $derived.by((): string => {
    if (display === 'text') {
      const value: DurationValue =
        elapsed < MINUTE ? { seconds } : hours > 0 ? { hours, minutes } : { minutes };
      return formatDuration(value, locales, 'short');
    }
    return hours > 0
      ? `${one.format(hours)}:${two.format(minutes)}:${two.format(seconds)}`
      : `${one.format(minutes)}:${two.format(seconds)}`;
  });

  const spoken = $derived.by((): string => {
    if (elapsed < MINUTE) return lessThanMinuteLabel;
    const value: DurationValue = hours > 0 ? { hours, minutes } : { minutes };
    return formatDuration(value, locales, 'long');
  });

  $effect(() => {
    now = Date.now();
    if (stop !== undefined) return;
    const timer = setInterval(() => {
      now = Date.now();
    }, SECOND);
    return () => clearInterval(timer);
  });
</script>

<span {...rest} role="timer" aria-label={label} class={['inline-flex flex-wrap items-baseline gap-2', className]}>
  <span aria-hidden="true">{label}</span>
  <span aria-hidden="true" class="font-mono tabular-nums">{shown}</span>
  <span class="sr-only">{spoken}</span>
</span>
