<!-- Cards with links, drawn by the `item` snippet. -->
<script lang="ts">
  import Stack from '../../../src/lib/ui/Stack.svelte';
  import type { StackDirection } from '../../../src/lib/ui/tones.ts';

  interface Props {
    count?: number | undefined;
    direction?: StackDirection | undefined;
    names?: readonly string[] | undefined;
  }

  let { count, direction, names = ['Tomato', 'Basil', 'Chilli'] }: Props = $props();
</script>

<button type="button">Before</button>
<Stack items={names} {count} {direction} data-testid="stack" class="w-48">
  {#snippet item(name, top)}
    <div class="card bg-base-200 p-4" data-top={top}><a href={`/plants/${name}`}>{name}</a></div>
  {/snippet}
</Stack>
<button type="button">After</button>
