<!-- @component
Internal: a row's `items` through `item` when it doesn't overflow, else its `children`.
-->
<script lang="ts" generics="T extends OverflowEntry">
  import type { Snippet } from 'svelte';
  import type { OverflowEntry, OverflowItemAttributes } from './Overflow.svelte';

  interface Props {
    items: readonly T[] | undefined;
    item: Snippet<[T, number, OverflowItemAttributes]> | undefined;
    children: Snippet<[]> | undefined;
  }

  let { items, item, children }: Props = $props();
</script>

{#if items !== undefined && item !== undefined}
  {#each items as entry, index (entry.id)}{@render item(entry, index, {})}{/each}
{:else}
  {@render children?.()}
{/if}
