<!--
  Test fixture: a wrapper that declares its own optional props and forwards
  every one of them to `NumberFormat` unconditionally, the way an application
  component built on this library does. Under `exactOptionalPropertyTypes` an
  omitted prop arrives here as an explicit `undefined`, so this file only
  type-checks while `NumberFormat` declares each forwarded prop
  `T | undefined` (#45). `vp run check` is the assertion; the browser test
  that renders it pins that the forwarded `undefined` still falls back to
  `NumberFormat`'s own defaults.
-->
<script lang="ts">
  import NumberFormat from '../../../src/lib/formatting/Number.svelte';

  interface Props {
    value: number;
    locales?: string | undefined;
    style?: 'decimal' | 'percent' | undefined;
    maximumFractionDigits?: number | undefined;
    minimumFractionDigits?: number | undefined;
  }

  let { value, locales, style, maximumFractionDigits, minimumFractionDigits }: Props = $props();
</script>

<NumberFormat {value} {locales} {style} {maximumFractionDigits} {minimumFractionDigits} />
