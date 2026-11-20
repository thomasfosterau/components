<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Splitter from '../../lib/layout/Splitter.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Splitter',
    component: Splitter,
    parameters: {
      docs: {
        description: {
          component:
            'Two panes and an APG window-splitter handle: drag it, or focus it and use the arrow keys, Home and End (and Enter when `collapsible`). `size` is the leading pane in percent; `onCommit` reports each settled size, the hook to persist a layout.',
        },
      },
    },
  });

  let committed = $state<number | undefined>(undefined);
</script>

{#snippet pane(text: string)}
  <div class="bg-base-200 text-base-content/70 flex h-full items-center justify-center p-4">{text}</div>
{/snippet}

<Story name="Side by side" asChild>
  <div class="h-72">
    <Splitter
      class="h-full"
      handleLabel="Resize properties panel"
      onCommit={(size) => {
        committed = size;
      }}
    >
      {#snippet start()}{@render pane('Plan canvas')}{/snippet}
      {#snippet end()}{@render pane('Bed 4 properties')}{/snippet}
    </Splitter>
  </div>
  <p class="mt-2 text-sm">Last committed: {committed === undefined ? 'nothing yet' : `${Math.round(committed)}%`}</p>
</Story>

<Story name="Stacked, collapsible" asChild>
  <div class="h-96">
    <Splitter class="h-full" orientation="vertical" collapsible size={60} handleLabel="Resize the map">
      {#snippet start()}{@render pane('Map (press Enter on the handle to collapse it)')}{/snippet}
      {#snippet end()}{@render pane('Planting list')}{/snippet}
    </Splitter>
  </div>
</Story>

<Story name="Three panes, nested" asChild>
  <div class="h-80">
    <Splitter class="h-full" size={25} minSize={15} maxSize={40} handleLabel="Resize the bed list">
      {#snippet start()}{@render pane('Beds')}{/snippet}
      {#snippet end()}
        <Splitter class="h-full" size={65} handleLabel="Resize the inspector">
          {#snippet start()}{@render pane('Bed 4 plan')}{/snippet}
          {#snippet end()}{@render pane('Inspector')}{/snippet}
        </Splitter>
      {/snippet}
    </Splitter>
  </div>
</Story>
