<!-- The infinite-load story's state: a page of 50 more rows arrives 600 ms
     after the list reaches its end, up to `total`. Timers only — a story
     never touches the network. -->
<script lang="ts">
  import VirtualList from '../../lib/data/VirtualList.svelte';

  interface Observation {
    readonly id: number;
    readonly species: string;
  }

  interface Props {
    total?: number;
  }

  let { total = 500 }: Props = $props();

  const species = ['Superb fairywren', 'Laughing kookaburra', 'Rainbow lorikeet', 'Australian magpie'];
  const page = (from: number): readonly Observation[] =>
    Array.from({ length: 50 }, (_, offset) => ({
      id: from + offset,
      species: species[(from + offset) % species.length] ?? '',
    }));

  let items = $state<readonly Observation[]>(page(0));
  let busy = $state(false);

  function loadMore(): void {
    busy = true;
    setTimeout(() => {
      items = [...items, ...page(items.length)];
      busy = false;
    }, 600);
  }
</script>

<VirtualList
  {items}
  {busy}
  {total}
  key={(observation) => observation.id}
  estimateSize={48}
  label="Observations"
  onEndReached={loadMore}
  class="border-base-300 h-96 rounded-box border"
>
  {#snippet row(observation, { index })}
    <div class="border-base-300 flex h-full items-center gap-3 border-b px-4">
      <span class="text-base-content/60 w-12 text-sm tabular-nums">{index + 1}</span>
      <a class="link" href="/observations/{observation.id}">{observation.species}</a>
    </div>
  {/snippet}
</VirtualList>
<p class="text-base-content/70 mt-2 text-sm" aria-live="polite">
  {busy ? 'Loading more…' : `${items.length} of ${total} loaded`}
</p>
