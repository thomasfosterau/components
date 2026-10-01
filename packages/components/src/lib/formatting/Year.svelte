<!-- @component
A `<time>` element carrying just a year, for dates whose precision really is a year.
-->
<!--
  Year — a `<time>` element carrying just a year: `datetime="1925"`, and
  `Intl.DateTimeFormat`'s locale rendering of the year (with its era, when
  asked) as the text. For publication dates, lifespans and anything else whose
  precision really is a year.

  ARIA contract: none beyond the native `<time>` semantics. `datetime` is a
  valid HTML year string (four or more digits), so the value stays
  machine-readable at the precision it actually has rather than claiming a
  midnight-on-1-January instant.

  A `number` is a CALENDAR YEAR (`1925`), not an epoch timestamp — that is
  what a caller holding "the year" has. A `Date` or string is read as an
  instant and its UTC year is taken, so a date at midnight UTC never renders
  as the previous year in a timezone west of Greenwich. Years before 1 CE have
  no HTML year string, so for those `datetime` falls back to the ISO instant.
-->
<script lang="ts">
  import type { HTMLTimeAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props extends HTMLTimeAttributes {
    /** A calendar year, or an instant (its UTC year is used). */
    value: Date | number | string;
    /**
     * Locale(s) for `Intl` formatting; omitted, the components context's `locale()`.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
    /** Append the era: `1925 AD`. */
    era?: Intl.DateTimeFormatOptions['era'];
    /**
     * Four digits or two.
     * @defaultValue `'numeric'`
     */
    representation?: 'numeric' | '2-digit' | undefined;
  }

  let {
    value,
    locales = getComponentsContext().locale(),
    era,
    representation = 'numeric',
    ...rest
  }: Props = $props();

  const instant = $derived.by(() => {
    if (typeof value !== 'number') return new Date(value);
    const date = new Date(Date.UTC(2000, 0, 1));
    date.setUTCFullYear(value);
    return date;
  });
  const format = $derived(
    new Intl.DateTimeFormat(locales, { year: representation, era, timeZone: 'UTC' }),
  );
  const formatted = $derived(format.format(instant));
  const year = $derived(instant.getUTCFullYear());
  const datetime = $derived(year >= 1 ? String(year).padStart(4, '0') : instant.toISOString());
</script>

<time {...rest} {datetime}>{formatted}</time>
