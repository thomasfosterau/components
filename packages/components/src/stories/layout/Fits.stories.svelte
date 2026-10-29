<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Fits from '../../lib/layout/Fits.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Fits',
    component: Fits,
    parameters: {
      docs: {
        description: {
          component:
            'Shows the first layout that fits its container, at declared container widths (CSS container queries). Resize the frame: a row, then a column, then a single "More" button. Only one copy is ever in the accessibility tree.',
        },
      },
    },
  });
</script>

{#snippet actions(direction: 'row' | 'column')}
  <div class={['flex gap-2', direction === 'column' && 'flex-col']}>
    {#each ['Save', 'Share', 'Print'] as label (label)}<button type="button" class="btn">{label}</button>{/each}
  </div>
{/snippet}
{#snippet row()}{@render actions('row')}{/snippet}
{#snippet column()}{@render actions('column')}{/snippet}
{#snippet menu()}
  <button type="button" class="btn">More</button>
{/snippet}

<Story name="Row, column, menu">
  <div class="resize-x overflow-auto border p-2" style="width: 40rem">
    <Fits breakpoints={['36rem', '20rem']} layouts={[row, column, menu]} />
  </div>
</Story>
