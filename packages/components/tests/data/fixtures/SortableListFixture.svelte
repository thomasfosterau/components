<!-- Six garden beds in a bound `SortableList`. The suite has no Tailwind, so
     each row's height is inline: the pointer test needs real, known
     geometry. The current order is mirrored into a `data-order` attribute
     so a test reads what the binding wrote back. -->
<script lang="ts">
  import SortableList from '../../../src/lib/data/SortableList.svelte';

  interface Bed {
    readonly id: number;
    readonly name: string;
  }

  interface Props {
    onReorder?: ((from: number, to: number) => void | Promise<void>) | undefined;
    moveMenu?: boolean | undefined;
    handle?: boolean | undefined;
    orientation?: 'vertical' | 'horizontal' | undefined;
  }

  let { onReorder, moveMenu = true, handle = true, orientation = 'vertical' }: Props = $props();

  let items = $state<Bed[]>(
    [1, 2, 3, 4, 5, 6].map((id) => ({ id, name: `Bed ${id}` })),
  );
</script>

<p data-testid="order">{items.map((bed) => bed.name).join(', ')}</p>

<SortableList
  bind:items
  key={(bed) => bed.id}
  itemLabel={(bed) => bed.name}
  {onReorder}
  {moveMenu}
  {handle}
  {orientation}
  aria-label="Beds"
  style="margin: 0; padding: 0; list-style: none;"
>
  {#snippet row(bed)}
    <span style="display: block; height: 40px; line-height: 40px;">{bed.name}</span>
  {/snippet}
</SortableList>
