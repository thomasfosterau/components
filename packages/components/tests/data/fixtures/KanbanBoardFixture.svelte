<script lang="ts">
  import { untrack } from 'svelte';
  import KanbanBoard from '../../../src/lib/data/KanbanBoard.svelte';
  import type { BoardColumn } from '../../../src/lib/data/board.ts';

  interface Crop {
    readonly id: string;
    readonly name: string;
  }

  interface Props {
    onMove?:
      | ((cardId: string, toColumn: string, toIndex: number, signal: AbortSignal) => Promise<void>)
      | undefined;
    enforceLimits?: boolean | undefined;
    /** The board's width: narrow enough and the columns become tabs. */
    width?: string | undefined;
  }

  let { onMove, enforceLimits = false, width = '1000px' }: Props = $props();

  const crop = (name: string): Crop => ({ id: name.toLowerCase(), name });

  let columns: BoardColumn<Crop>[] = $state(
    untrack(() => [
      { id: 'planned', title: 'Planned', cards: ['Tomato', 'Basil', 'Carrot'].map(crop) },
      { id: 'sown', title: 'Sown', cards: ['Pea'].map(crop), limit: 1 },
      { id: 'harvested', title: 'Harvested', cards: [] },
    ]),
  );
</script>

<div style:width>
<KanbanBoard
  bind:columns
  key={(card) => card.id}
  cardLabel={(card) => card.name}
  {onMove}
  {enforceLimits}
>
  {#snippet card(item)}<span>{item.name}</span>{/snippet}
</KanbanBoard>
</div>
<output data-testid="columns"
  >{columns.map((column) => `${column.id}: ${column.cards.map((c) => c.name).join(' ')}`).join(' | ')}</output
>
