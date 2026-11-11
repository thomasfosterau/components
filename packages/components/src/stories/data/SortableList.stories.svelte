<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SortableList from '../../lib/data/SortableList.svelte';
  import Badge from '../../lib/ui/Badge.svelte';

  interface Stop {
    readonly id: string;
    readonly name: string;
    readonly note: string;
  }

  const stops: readonly Stop[] = [
    { id: 'shed', name: 'Tool shed', note: 'Collect secateurs' },
    { id: 'bed-1', name: 'Bed 1', note: 'Thin the carrots' },
    { id: 'bed-2', name: 'Bed 2', note: 'Stake the tomatoes' },
    { id: 'bed-3', name: 'Bed 3', note: 'Harvest garlic' },
    { id: 'compost', name: 'Compost', note: 'Turn the heap' },
  ];

  const stopKey = (stop: Stop): string => stop.id;
  const stopName = (stop: Stop): string => stop.name;

  const { Story } = defineMeta({
    title: 'Data/SortableList',
    component: SortableList,
    parameters: {
      docs: {
        description: {
          component:
            'Reorder by dragging a handle, by keyboard (Space to pick up, arrows to move, Space to drop, Escape to cancel) or through each row’s Move menu. Every step is announced politely with its position. The order is controlled: `items` is bindable and `onReorder(from, to)` reports each committed move; a rejected promise undoes it.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let route = $state([...stops]);
  let tags = $state(['Perennial', 'Edible', 'Shade', 'Native', 'Pollinator']);
  let saved = $state([...stops]);
  let failNext = $state(true);
  let menuOnly = $state([...stops]);

  // Every other save fails, so the story shows both outcomes.
  const persist = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const fail = failNext;
      failNext = !failNext;
      setTimeout(() => (fail ? reject(new Error('Offline')) : resolve()), 600);
    });
</script>

{#snippet stopRow(stop: Stop)}
  <div class="flex flex-col py-1">
    <span class="font-medium">{stop.name}</span>
    <span class="text-base-content/70 text-sm">{stop.note}</span>
  </div>
{/snippet}

{#snippet tagRow(tag: string)}
  <Badge>{tag}</Badge>
{/snippet}

<Story name="Vertical list">
  <SortableList
    bind:items={route}
    key={stopKey}
    itemLabel={stopName}
    row={stopRow}
    aria-label="Garden round"
    class="max-w-md"
  />
</Story>

<Story name="Horizontal chips">
  <!-- ← / → move a held chip (mirrored right-to-left); the menu says "Move
       back" / "Move forward" rather than up and down. -->
  <SortableList
    bind:items={tags}
    key={(tag) => tag}
    itemLabel={(tag) => tag}
    row={tagRow}
    orientation="horizontal"
    aria-label="Tags"
  />
</Story>

<Story name="Async persist with rollback">
  <!-- `onReorder` returns a promise; every other one rejects, and the list
       puts the row back and announces that it could not be moved. -->
  <SortableList
    bind:items={saved}
    key={stopKey}
    itemLabel={stopName}
    row={stopRow}
    onReorder={persist}
    aria-label="Garden round, saved"
    class="max-w-md"
  />
</Story>

<Story name="Move menu only">
  <!-- No drag handle: the menu's commands need no mode, which suits switch
       and voice-control users ("Move up" is a speakable command). -->
  <SortableList
    bind:items={menuOnly}
    key={stopKey}
    itemLabel={stopName}
    row={stopRow}
    handle={false}
    aria-label="Garden round, menu only"
    class="max-w-md"
  />
</Story>
