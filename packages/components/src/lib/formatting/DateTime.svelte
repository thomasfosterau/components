<!-- @component
A `<time>` element with the ISO instant in `datetime` and the `Intl.DateTimeFormat` rendering as its text.
-->
<!--
  DateTime — a `<time>` element carrying the ISO instant in `datetime` and
  `Intl.DateTimeFormat`'s locale rendering as its text.

  ARIA contract: none beyond the native `<time>` semantics — the `datetime`
  attribute is what makes the value machine-readable; a screen reader still
  announces the formatted text content (or the `children` snippet, when
  given), never the ISO string.

  `options` (raw `Intl.DateTimeFormatOptions`) wins over `dateStyle`/
  `timeStyle` when both are supplied, so a caller that needs a field-level
  combination (`{ year: 'numeric', month: 'long' }`) isn't stuck with the
  coarse style presets.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLTimeAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props extends Omit<HTMLTimeAttributes, 'children'> {
    /** The instant: a `Date`, epoch milliseconds or an ISO string. */
    value: Date | number | string;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
    /**
     * `Intl.DateTimeFormat` `dateStyle`.
     * @defaultValue `'medium'`
     */
    dateStyle?: Intl.DateTimeFormatOptions['dateStyle'] | undefined;
    /** `Intl.DateTimeFormat` `timeStyle`; omitted, no time is shown. */
    timeStyle?: Intl.DateTimeFormatOptions['timeStyle'] | undefined;
    /** Raw `Intl.DateTimeFormatOptions`; wins over `dateStyle`/`timeStyle` when given. */
    options?: Intl.DateTimeFormatOptions | undefined;
    /** Replaces the formatted text; the `datetime` attribute stays machine-readable. */
    children?: Snippet<[]> | undefined;
  }

  let {
    value,
    locales = getComponentsContext().locale(),
    dateStyle = 'medium',
    timeStyle,
    options,
    children,
    ...rest
  }: Props = $props();

  const instant = $derived(new Date(value));
  // The formatter and the formatted string are separate `$derived` values so
  // constructing the (relatively expensive) `Intl.DateTimeFormat` is skipped
  // when only `value` changes, not when locale/options change. See
  // PERF-CPU-003 in docs/specs/performance-invariants.md.
  const format = $derived(new Intl.DateTimeFormat(locales, options ?? { dateStyle, timeStyle }));
  const formatted = $derived(format.format(instant));
  const iso = $derived(instant.toISOString());
</script>

<time {...rest} datetime={iso}>
  {#if children}{@render children()}{:else}{formatted}{/if}
</time>
