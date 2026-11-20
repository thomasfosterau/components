<script lang="ts">
  import { untrack } from 'svelte';
  import KanbanBoard from '../../lib/data/KanbanBoard.svelte';
  import type { BoardColumn } from '../../lib/data/board.ts';
  import Badge from '../../lib/ui/Badge.svelte';

  interface Planting {
    readonly id: string;
    readonly crop: string;
    readonly bed: string;
  }

  interface Props {
    /** Give columns work-in-progress limits and refuse moves into full ones. */
    limits?: boolean | undefined;
    /** Persist with a delay, failing every third move, to show rollback. */
    slow?: boolean | undefined;
  }

  let { limits = false, slow = false }: Props = $props();

  const p = (crop: string, bed: string): Planting => ({ id: `${crop}-${bed}`.toLowerCase(), crop, bed });

  let columns: BoardColumn<Planting>[] = $state(
    untrack(() => [
      { id: 'planned', title: 'Planned', cards: [p('Tomato', 'Bed 1'), p('Basil', 'Bed 1'), p('Carrot', 'Bed 3')] },
      { id: 'sown', title: 'Sown', cards: [p('Pea', 'Bed 2'), p('Lettuce', 'Bed 4')], limit: limits ? 2 : undefined },
      { id: 'growing', title: 'Growing', cards: [p('Garlic', 'Bed 5')], limit: limits ? 3 : undefined },
      { id: 'harvested', title: 'Harvested', cards: [p('Radish', 'Bed 2')] },
    ]),
  );

  let moves = 0;
  const onMove = async (_card: string, _column: string, _index: number, signal: AbortSignal): Promise<void> => {
    if (!slow) return;
    moves += 1;
    const fail = moves % 3 === 0;
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (fail && !signal.aborted) throw new Error('Could not save');
  };
</script>

<KanbanBoard
  bind:columns
  key={(card) => card.id}
  cardLabel={(card) => `${card.crop} in ${card.bed}`}
  {onMove}
  enforceLimits={limits}
  label="Plantings"
>
  {#snippet card(item)}
    <div class="flex items-center justify-between gap-2">
      <span class="font-medium">{item.crop}</span>
      <Badge size="sm">{item.bed}</Badge>
    </div>
  {/snippet}
</KanbanBoard>
