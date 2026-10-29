<!-- @component
Shows the first of several layouts that fits its container, switching at declared container widths (CSS container queries, no JavaScript).
-->
<!--
  Fits — the model is SwiftUI's `ViewThatFits`: "the horizontal button row
  if it fits, else the stacked one, else a menu". CSS cannot measure
  content's intrinsic width, so, unlike SwiftUI, it switches at declared
  container widths: `breakpoints[i]` is the width below which `layouts[i]`
  stops fitting. It is an `@container`, so the switch follows the space the
  component actually has, not the viewport.

  A JavaScript-measuring mode (render all, measure, hide) was considered and
  left out: it shifts layout after first paint and cannot agree with
  server-rendered HTML.

  Every layout is rendered; all but the active one are `display: none`, so
  assistive technology meets exactly one copy of each control at any width.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { fitsLayoutClass, type FitsBreakpoint } from './space.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Layouts in order of preference, widest first. */
    layouts: readonly Snippet<[]>[];
    /** Container width below which each layout stops fitting; one fewer than `layouts`, descending. */
    breakpoints: readonly FitsBreakpoint[];
  }

  let { layouts, breakpoints, class: className, ...rest }: Props = $props();
</script>

<div {...rest} class={['@container', className]}>
  {#each layouts as layout, index (index)}
    <div class={fitsLayoutClass(index, layouts.length, breakpoints)}>{@render layout()}</div>
  {/each}
</div>
