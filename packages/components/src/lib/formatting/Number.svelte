<!--
  NumberFormat — a `<data>` element whose text is `Intl.NumberFormat`'s
  rendering and whose `value` attribute is the raw number/bigint, so the
  machine-readable figure survives locale formatting.

  Exported as `NumberFormat` (not `Number`) to avoid shadowing the global.

  ARIA contract: none beyond native `<data>` semantics — `value` carries the
  machine-readable figure, the rendered text carries the locale-formatted one.
-->
<script lang="ts">
  import type { HTMLDataAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props extends Omit<HTMLDataAttributes, 'value'> {
    value: number | bigint;
    locales?: string | readonly string[] | undefined;
    style?: Intl.NumberFormatOptions['style'];
    unit?: string | undefined;
    unitDisplay?: Intl.NumberFormatOptions['unitDisplay'];
    currency?: string | undefined;
    currencyDisplay?: Intl.NumberFormatOptions['currencyDisplay'];
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    signDisplay?: Intl.NumberFormatOptions['signDisplay'];
    notation?: Intl.NumberFormatOptions['notation'];
    /** Raw `Intl.NumberFormatOptions`; wins over the individual style props when given. */
    options?: Intl.NumberFormatOptions | undefined;
  }

  let {
    value,
    locales = getComponentsContext().locale(),
    style = 'decimal',
    unit,
    unitDisplay = 'short',
    currency,
    currencyDisplay = 'symbol',
    maximumFractionDigits,
    minimumFractionDigits,
    signDisplay,
    notation,
    options,
    ...rest
  }: Props = $props();

  // The formatter and the formatted string are separate `$derived` values so
  // constructing the (relatively expensive) `Intl.NumberFormat` is skipped
  // when only `value` changes. See PERF-CPU-003 in
  // docs/specs/performance-invariants.md.
  const format = $derived(
    new Intl.NumberFormat(
      locales,
      options ?? {
        style,
        unit,
        unitDisplay,
        currency,
        currencyDisplay,
        maximumFractionDigits,
        minimumFractionDigits,
        signDisplay,
        notation,
      },
    ),
  );
  const formatted = $derived(format.format(value));
  const raw = $derived(String(value));
</script>

<data {...rest} value={raw}>{formatted}</data>
