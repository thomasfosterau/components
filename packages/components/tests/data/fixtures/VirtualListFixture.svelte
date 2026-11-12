<!-- `VirtualList` windows against a real scroll container, so the fixture
     gives it a fixed height inline (the suite runs without Tailwind) and rows
     whose content has a known height. -->
<script lang="ts">
  import VirtualList from '../../../src/lib/data/VirtualList.svelte';
  import type { VirtualListApi } from '../../../src/lib/data/virtual.svelte.ts';

  interface Row {
    readonly id: number;
    readonly height: number;
  }

  interface Props {
    count?: number;
    items?: readonly Row[];
    measure?: boolean;
    semantics?: 'list' | 'feed';
    busy?: boolean;
    total?: number;
    label?: string;
    onEndReached?: () => void;
    onApi?: (api: VirtualListApi) => void;
    surround?: boolean;
  }

  let {
    count = 10_000,
    items,
    measure = false,
    semantics = 'list',
    busy = false,
    total,
    label = 'Observations',
    onEndReached,
    onApi,
    surround = false,
  }: Props = $props();

  // Measured rows vary between 20 and 80 px so a fixed estimate is wrong for most.
  const rows = $derived(
    items ??
      Array.from({ length: count }, (_, index): Row => ({ id: index, height: 20 + (index % 7) * 10 })),
  );

  let api: VirtualListApi | undefined = $state();

  $effect(() => {
    if (api !== undefined) onApi?.(api);
  });
</script>

{#if surround}<button type="button">Before the feed</button>{/if}
<VirtualList
  items={rows}
  key={(entry) => entry.id}
  {measure}
  {semantics}
  {busy}
  {total}
  {label}
  {onEndReached}
  estimateSize={40}
  bind:api
  data-testid="scroller"
  style="height: 400px; overflow: auto"
>
  {#snippet row(entry, { index })}
    <div style:height={measure ? `${entry.height}px` : undefined}>
      <a href="/observations/{entry.id}">Observation {index + 1}</a>
    </div>
  {/snippet}
</VirtualList>
{#if surround}<button type="button">After the feed</button>{/if}
