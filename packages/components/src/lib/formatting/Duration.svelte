<!-- @component
A length of time ("2 hr, 30 min") in a `<time>` element whose `datetime` is the ISO 8601 duration.
-->
<!--
  Duration — the length-of-time counterpart of `DateTime` (an instant) and
  `RelativeTime` (an instant relative to now), formatted by
  `formatDuration` (see `duration.ts`).

  ARIA contract: none beyond the native `<time>`. Its `datetime` holds the
  HTML duration string (`PT2H30M`), the content the localised text.
-->
<script lang="ts">
  import type { HTMLTimeAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import {
    durationFromMilliseconds,
    formatDuration,
    toIsoDuration,
    type DurationStyle,
    type DurationValue,
  } from './duration.ts';

  interface Props extends Omit<HTMLTimeAttributes, 'children'> {
    /** A `DurationValue`, or milliseconds. */
    value: DurationValue | number;
    /**
     * How it is spelled.
     * @defaultValue `'short'`
     */
    style?: DurationStyle | undefined;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let { value, style = 'short', locales = getComponentsContext().locale(), ...rest }: Props = $props();

  const duration = $derived(typeof value === 'number' ? durationFromMilliseconds(value) : value);
</script>

<time {...rest} datetime={toIsoDuration(duration)}>{formatDuration(duration, locales, style)}</time>
