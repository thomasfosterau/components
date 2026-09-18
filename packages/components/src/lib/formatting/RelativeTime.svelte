<!--
  RelativeTime — "3 days ago" / "in 2 hours" via `Intl.RelativeTimeFormat`,
  picking the largest unit (seconds → years) whose magnitude is at least one.

  ARIA contract: none beyond native `<time>` semantics. The absolute instant
  is never hidden — it is both the machine-readable `datetime` and the
  human-readable `title`, so a reader who hovers (or a tool that reads
  `title`) gets the precise moment the relative text is glossing over.
-->
<script lang="ts">
  import type { HTMLTimeAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props extends HTMLTimeAttributes {
    value: Date | number | string;
    /** The instant "now" is measured from; defaults to the current wall clock at render. */
    now?: Date | number | undefined;
    locales?: string | readonly string[] | undefined;
    numeric?: Intl.RelativeTimeFormatOptions['numeric'];
    style?: Intl.RelativeTimeFormatOptions['style'];
  }

  let {
    value,
    now,
    locales = getComponentsContext().locale(),
    numeric = 'auto',
    style = 'long',
    ...rest
  }: Props = $props();

  const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'year', ms: 365.25 * 24 * 60 * 60 * 1000 },
    { unit: 'month', ms: 30.44 * 24 * 60 * 60 * 1000 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
    { unit: 'second', ms: 1000 },
  ];

  const instant = $derived(new Date(value));
  const reference = $derived(new Date(now ?? Date.now()));
  const diffMs = $derived(instant.getTime() - reference.getTime());

  // Largest unit whose magnitude rounds to at least one; falls back to
  // seconds for anything smaller (e.g. "0 seconds ago" / "in 0 seconds").
  const picked = $derived(
    UNITS.find((candidate) => Math.abs(diffMs) >= candidate.ms) ?? UNITS[UNITS.length - 1]!,
  );
  const roundedValue = $derived(Math.round(diffMs / picked.ms));

  // The formatter and the formatted string are separate `$derived` values so
  // constructing the (relatively expensive) `Intl.RelativeTimeFormat` is
  // skipped when only `value`/`now` change. See PERF-CPU-003 in
  // docs/specs/performance-invariants.md.
  const format = $derived(new Intl.RelativeTimeFormat(locales, { numeric, style }));
  const formatted = $derived(format.format(roundedValue, picked.unit));

  const iso = $derived(instant.toISOString());
  const absoluteFormat = $derived(
    new Intl.DateTimeFormat(locales, { dateStyle: 'full', timeStyle: 'short' }),
  );
  const absolute = $derived(absoluteFormat.format(instant));
</script>

<time {...rest} datetime={iso} title={absolute}>{formatted}</time>
