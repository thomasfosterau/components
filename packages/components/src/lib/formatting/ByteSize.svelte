<!-- @component
A byte count as a locale-formatted size in the largest sensible unit ("4.2 MB", "1.5 KiB"), in a `<data>` element whose `value` keeps the raw count.
-->
<!--
  ByteSize — `formatBytes` rendered as `<data value={bytes}>`, like
  `NumberFormat`. `Intl.NumberFormat` has byte units but does not CHOOSE
  one; `formatBytes` picks the largest unit whose rounded value is at least
  1, in SI (`'file'`, base 1000) or IEC (`'memory'`, base 1024).

  ARIA contract: screen readers often spell a short unit out letter by
  letter ("M B"), so unless `unitDisplay` is already `'long'` the visible
  short form is `aria-hidden` and a `VisuallyHidden` long form ("4.2
  megabytes") is read instead. `includeExact` adds the exact count ("4,200,000
  bytes") as a `title` and to the read text. `NaN` renders an empty `<data>`.
-->
<script lang="ts">
  import type { HTMLDataAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import {
    formatBytes,
    formatExactBytes,
    type ByteStyle,
    type ByteUnit,
    type PluralLabel,
  } from './bytes.ts';

  interface Props extends Omit<HTMLDataAttributes, 'value' | 'style'> {
    /** The size in bytes; also the `value` attribute. */
    bytes: number;
    /**
     * `'file'`: SI, base 1000 (kB, MB). `'memory'`: IEC, base 1024 (KiB, MiB).
     * @defaultValue `'file'`
     */
    style?: ByteStyle | undefined;
    /**
     * `Intl` unit display; a plain byte count is always written out ("999 bytes") unless `'narrow'`.
     * @defaultValue `'short'`
     */
    unitDisplay?: 'short' | 'narrow' | 'long' | undefined;
    /**
     * Fraction digits shown.
     * @defaultValue `1`, or `0` for bytes and kilobytes
     */
    maximumFractionDigits?: number | undefined;
    /** Restrict the units chosen from, e.g. `['megabyte', 'gigabyte']`. */
    allowedUnits?: readonly ByteUnit[] | undefined;
    /**
     * Show `zeroLabel` for 0 instead of "0 bytes".
     * @defaultValue `false`
     */
    spellOutZero?: boolean | undefined;
    /**
     * The text for 0 when `spellOutZero` is on.
     * @defaultValue `'Zero bytes'`
     */
    zeroLabel?: string | undefined;
    /**
     * Add the exact count as a `title` and to the read text ("4.2 megabytes, 4,200,000 bytes").
     * @defaultValue `false`
     */
    includeExact?: boolean | undefined;
    /** Short IEC labels for `'memory'` style. @defaultValue `B`, `KiB`, `MiB`, … */
    iecUnits?: Readonly<Record<ByteUnit, string>> | undefined;
    /** Long IEC labels for `'memory'` style. @defaultValue `bytes`, `kibibytes`, … */
    iecLongUnits?: Readonly<Record<ByteUnit, PluralLabel>> | undefined;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    bytes,
    style = 'file',
    unitDisplay = 'short',
    maximumFractionDigits,
    allowedUnits,
    spellOutZero = false,
    zeroLabel = 'Zero bytes',
    includeExact = false,
    iecUnits,
    iecLongUnits,
    locales = getComponentsContext().locale(),
    title,
    ...rest
  }: Props = $props();

  const options = $derived({ style, maximumFractionDigits, allowedUnits, iecUnits, iecLongUnits });
  const zero = $derived(spellOutZero && bytes === 0);
  const shown = $derived(zero ? zeroLabel : formatBytes(bytes, { ...options, unitDisplay }, locales));
  const spoken = $derived(
    zero ? zeroLabel : formatBytes(bytes, { ...options, unitDisplay: 'long' }, locales),
  );
  const exact = $derived(includeExact ? formatExactBytes(bytes, locales) : '');
  const read = $derived(exact === '' || zero ? spoken : `${spoken}, ${exact}`);
  const separate = $derived(read !== shown);
</script>

<data {...rest} value={Number.isFinite(bytes) ? String(bytes) : ''} title={title ?? (exact || undefined)}>
  {#if separate}<span aria-hidden="true">{shown}</span><VisuallyHidden>{read}</VisuallyHidden>{:else}{shown}{/if}
</data>
