<!-- @component
A named, wrapping set of `ActionChip`s (`role="group"`); each chip stays its own Tab stop.
-->
<!--
  ChipGroup — not a toolbar: filter chips are independent toggles read in
  order, so there is no roving focus. `gap-2` keeps targets from abutting.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The set's accessible name ("Plant type"). */
    label: string;
    /** The chips. */
    children: Snippet<[]>;
  }

  let { label, children, class: className, ...rest }: Props = $props();
</script>

<div {...rest} role="group" aria-label={label} class={['flex flex-wrap gap-2', className]}>
  {@render children()}
</div>
