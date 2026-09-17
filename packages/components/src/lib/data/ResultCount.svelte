<!--
  ResultCount — "Showing 24 of 310" under a list.

  Every list an API serves is a `LIMIT`ed window, so a page that showed only
  the window would quietly imply it was everything; this says otherwise. It
  renders nothing when `shown` is zero: an empty result is already saying
  "nothing here" through its empty state, and "Showing 0 of 0" beside that is
  noise, not reassurance.

  ARIA contract: a plain `<p>`. Not a live region — the count is part of the
  page that was just rendered, not an update to it, and announcing it on
  every keystroke of a filter is the thing live regions are misused for.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';

  interface Props extends Omit<HTMLAttributes<HTMLParagraphElement>, 'children'> {
    /** Rows on this page. */
    shown: number;
    /** Rows the query matched in total, before the window was applied. */
    total: number;
    /** The whole line, when "Showing x of y" is not the sentence wanted. */
    label?: ((shown: number, total: number) => string) | undefined;
    locales?: string | readonly string[] | undefined;
  }

  let {
    shown,
    total,
    label,
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

  // Formatter and formatted string in separate `$derived`s: the constructor
  // is the expensive half and only the locale should rebuild it.
  const counts = $derived(new Intl.NumberFormat(locales));
  const text = $derived(
    label === undefined
      ? `Showing ${counts.format(shown)} of ${counts.format(total)}`
      : label(shown, total),
  );
</script>

{#if shown > 0}
  <p {...rest} class={['text-base-content/60 text-sm tabular-nums', className]}>{text}</p>
{/if}
