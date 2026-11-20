<!-- @component
Keeps one `SwipeActions` row open at a time among the rows inside it. Renders no element.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setSwipeGroup } from './swipe-actions.svelte.ts';

  interface Props {
    /** The list holding the `SwipeActions` rows. */
    children: Snippet<[]>;
  }

  let { children }: Props = $props();

  setSwipeGroup();
</script>

{@render children()}
