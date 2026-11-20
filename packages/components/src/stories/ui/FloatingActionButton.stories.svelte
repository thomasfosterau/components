<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Leaf, PenLine, Plus, Sprout } from '@lucide/svelte';
  import FabMenu from '../../lib/ui/FabMenu.svelte';
  import FloatingActionButton from '../../lib/ui/FloatingActionButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/FloatingActionButton',
    component: FloatingActionButton,
    parameters: {
      docs: {
        description: {
          component:
            'The screen’s one primary action, fixed at the thumb. Its name is always `label`, visible when `extended`. `FabMenu` is a speed dial: a disclosure revealing a labelled group of actions. Give the page’s last row room (`pb-24`) so the button never covers it.',
        },
      },
    },
  });
</script>

{#snippet plus()}<Plus class="size-6" />{/snippet}
{#snippet pen()}<PenLine class="size-5" />{/snippet}
{#snippet sprout()}<Sprout class="size-5" />{/snippet}
{#snippet leaf()}<Leaf class="size-5" />{/snippet}

<Story name="Sizes" asChild>
  <div class="flex items-center gap-4 p-4">
    <FloatingActionButton label="New planting" icon={plus} size="sm" position="inline" />
    <FloatingActionButton label="New planting" icon={plus} position="inline" />
    <FloatingActionButton label="New planting" icon={plus} size="lg" position="inline" />
  </div>
</Story>

<Story name="Extended" asChild>
  <div class="flex items-center gap-4 p-4">
    <FloatingActionButton label="New planting" icon={plus} extended position="inline" />
    <FloatingActionButton label="Compose" icon={pen} extended tone="secondary" position="inline" />
  </div>
</Story>

<Story name="Collapse on scroll" asChild>
  <!-- Scroll the list: the label folds away going down and returns going up. -->
  <div class="relative">
    <ul class="divide-base-300 h-96 divide-y overflow-auto pb-24">
      {#each Array.from({ length: 40 }, (_, index) => index + 1) as row (row)}
        <li class="px-4 py-3">Planting {row}</li>
      {/each}
    </ul>
    <FloatingActionButton label="New planting" icon={plus} extended collapseOnScroll class="absolute end-4 bottom-4" position="inline" />
  </div>
</Story>

<Story name="Link" asChild>
  <div class="p-4">
    <FloatingActionButton label="New planting" icon={plus} href="/plantings/new" extended position="inline" />
  </div>
</Story>

<Story name="Speed dial" asChild>
  <div class="flex h-80 items-end justify-end p-4">
    <FabMenu
      label="Add"
      position="inline"
      items={[
        { label: 'Planting', icon: sprout, onSelect: () => undefined },
        { label: 'Harvest', icon: leaf, onSelect: () => undefined },
        { label: 'Note', icon: pen, href: '/notes/new' },
      ]}
    />
  </div>
</Story>

<Story name="Fixed, centred" asChild>
  <FloatingActionButton label="New planting" icon={plus} extended position="center" />
</Story>
