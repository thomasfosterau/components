<!--
  Skeleton — daisyUI `skeleton` placeholders for a surface whose data has not
  arrived. Three shapes: a `block` (one box, sized by the caller's `class`), a
  `circle` (an avatar), or `text` (`lines` rows of decreasing width, so the
  shimmer reads as a paragraph rather than a bar).

  ARIA contract: the shimmer conveys "loading" by animation alone, which is
  nothing to a screen reader, so the wrapper is a polite live region
  (`role="status"`) marked `aria-busy="true"` and named by `label`, and every
  shimmering box is `aria-hidden`. The label is an `aria-label` rather than
  visually hidden text because `status` does not take its name from its
  content — and it is the ONLY thing announced, since the fake paragraph
  shapes must not be read as content.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: 'block' | 'text' | 'circle' | undefined;
    /** Rows for the `text` variant. */
    lines?: number | undefined;
    /** What assistive technology announces in place of the shimmer. */
    label?: string | undefined;
  }

  let {
    variant = 'block',
    lines = 3,
    label = 'Loading',
    class: className,
    ...rest
  }: Props = $props();

  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2'] as const;
  const rows = $derived(
    Array.from(
      { length: Math.max(1, lines) },
      (_, index) => widths[index % widths.length] ?? 'w-full',
    ),
  );
</script>

<div {...rest} role="status" aria-busy="true" aria-label={label} class={className}>
  {#if variant === 'text'}
    <div class="flex flex-col gap-2" aria-hidden="true">
      {#each rows as width, index (index)}
        <div class={['skeleton h-4', width]}></div>
      {/each}
    </div>
  {:else if variant === 'circle'}
    <div class="skeleton size-12 shrink-0 rounded-full" aria-hidden="true"></div>
  {:else}
    <div class="skeleton h-24 w-full" aria-hidden="true"></div>
  {/if}
</div>
