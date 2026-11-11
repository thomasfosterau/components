<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ListDetailLayout from '../../lib/layout/ListDetailLayout.svelte';

  const { Story } = defineMeta({
    title: 'Layout/ListDetailLayout',
    component: ListDetailLayout,
    parameters: {
      docs: {
        description: {
          component:
            'A list and the selected item’s detail: side by side from `expandAt` up, one at a time below it, chosen by the route (`showDetail`) so it works without JavaScript. Resize the canvas to see the compact behaviour, with its Back link.',
        },
      },
    },
  });

  const beds = [
    { id: 'bed-1', name: 'Bed 1 — brassicas' },
    { id: 'bed-2', name: 'Bed 2 — alliums' },
    { id: 'bed-4', name: 'Bed 4 — tomatoes' },
  ];
</script>

{#snippet list()}
  <ul class="menu w-full">
    {#each beds as bed (bed.id)}
      <li>
        <a id={bed.id} href={`#${bed.id}`} aria-current={bed.id === 'bed-4' ? 'true' : undefined}
          >{bed.name}</a
        >
      </li>
    {/each}
  </ul>
{/snippet}
{#snippet detail()}
  <article class="p-4">
    <h2 class="text-lg font-semibold">Bed 4 — tomatoes</h2>
    <p>Six ‘Black Krim’, sown 14 September.</p>
  </article>
{/snippet}
{#snippet placeholder()}
  <p class="text-base-content/60 p-4">Choose a bed to see it here.</p>
{/snippet}

<Story name="Nothing selected">
  <div class="border-base-300 h-96 border">
    <ListDetailLayout {list} {detail} {placeholder} showDetail={false} backHref="#" />
  </div>
</Story>

<Story name="An item selected">
  <div class="border-base-300 h-96 border">
    <ListDetailLayout {list} {detail} {placeholder} showDetail backHref="#" focusTarget="bed-4" />
  </div>
</Story>
