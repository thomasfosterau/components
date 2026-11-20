<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BottomSheet from '../../lib/feedback/BottomSheet.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/BottomSheet',
    component: BottomSheet,
    parameters: {
      viewport: { defaultViewport: 'mobile1' },
      docs: {
        description: {
          component:
            'A sheet that rests at detents. Drag the grabber, or focus it and use ↑/↓, Home and End. Modal by default, with the same dialog contract as `Drawer`; `modal={false}` is a named region over a page that stays usable, where Escape collapses rather than closes.',
        },
      },
    },
  });

  const beds = Array.from({ length: 24 }, (_, i) => `Bed ${i + 1}`);

  let modalOpen = $state(false);
  let mapDetent = $state(0);
  let mapOpen = $state(true);
  let fitOpen = $state(false);
  let pinnedOpen = $state(false);
</script>

{#snippet bedList()}
  <ul class="divide-base-300 divide-y">
    {#each beds as bed (bed)}
      <li class="py-2">{bed}</li>
    {/each}
  </ul>
{/snippet}

<Story name="Modal with detents">
  <Button onclick={() => (modalOpen = true)}>Show results</Button>
  <BottomSheet
    bind:open={modalOpen}
    title="Results"
    description="24 beds within 1 km."
    detents={[0.25, 0.5, 0.92]}
    detentLabels={['Peek', 'Half', 'Full']}
  >
    {@render bedList()}
  </BottomSheet>
</Story>

<Story name="Non-modal over a map">
  <div class="bg-base-200 text-base-content/60 flex h-[80dvh] items-start justify-center pt-8">
    <Button onclick={() => (mapOpen = true)}>Map (still usable): show results</Button>
  </div>
  <BottomSheet
    bind:open={mapOpen}
    bind:detent={mapDetent}
    modal={false}
    title="Results"
    detents={[0.2, 0.5, 0.92]}
    detentLabels={['Collapsed', 'Half', 'Full']}
  >
    {@render bedList()}
  </BottomSheet>
</Story>

<Story name="Fit to content">
  <Button onclick={() => (fitOpen = true)}>Bed 4 actions</Button>
  <BottomSheet bind:open={fitOpen} title="Bed 4" detents={['content']}>
    <p>Two metres by 1.2, loam, last watered on Tuesday.</p>
    {#snippet actions({ close })}
      <Button variant="ghost" onclick={close}>Cancel</Button>
      <Button tone="primary" onclick={close}>Open the bed</Button>
    {/snippet}
  </BottomSheet>
</Story>

<Story name="Not dismissible by drag">
  <Button onclick={() => (pinnedOpen = true)}>Show the sheet</Button>
  <BottomSheet bind:open={pinnedOpen} title="Planting plan" dismissible={false} detents={[0.4, 0.92]}>
    <p>Dragging below the lowest detent snaps back; the close button still closes it.</p>
  </BottomSheet>
</Story>
