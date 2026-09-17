<!--
  Stats — the daisyUI `stats` wrapper a row of `StatTile`s sits in. It is what
  draws the dividers between tiles, so a lone tile still wants one.

  No ARIA of its own: it is a grouping box around text. When a row of stats
  needs a name (a dashboard with several), give it `aria-label` — the native
  attributes spread — or put it inside a `Section` that already has a heading.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { statsOrientation, type StatsOrientation } from './sizes.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Row, column, or stacked-then-row from the `sm` breakpoint up. */
    orientation?: StatsOrientation | undefined;
    children: Snippet<[]>;
  }

  let { orientation = 'responsive', children, class: className, ...rest }: Props = $props();
</script>

<div {...rest} class={['stats', statsOrientation[orientation], className]}>
  {@render children()}
</div>
