<!-- Each primitive with real children, in a container of a given width. -->
<script lang="ts">
  import './layout.css';
  import Cluster from '../../../src/lib/layout/Cluster.svelte';
  import Fits from '../../../src/lib/layout/Fits.svelte';
  import Grid from '../../../src/lib/layout/Grid.svelte';
  import HStack from '../../../src/lib/layout/HStack.svelte';
  import Spacer from '../../../src/lib/layout/Spacer.svelte';
  import VStack from '../../../src/lib/layout/VStack.svelte';
  import type { FlowElement, Gap, MinItem } from '../../../src/lib/layout/space.ts';

  interface Props {
    kind: 'vstack' | 'hstack' | 'cluster' | 'grid' | 'fits' | 'spacer';
    width?: number | undefined;
    as?: FlowElement | undefined;
    gap?: Gap | undefined;
    minItem?: MinItem | undefined;
    divider?: boolean | undefined;
    responsive?: boolean | undefined;
  }

  let { kind, width = 900, as, gap, minItem, divider, responsive }: Props = $props();
  const list = $derived(as === 'ul' || as === 'ol');
</script>

{#snippet three()}
  {#each ['Sow', 'Water', 'Harvest'] as step (step)}
    {#if list}<li>{step}</li>{:else}<span>{step}</span>{/if}
  {/each}
{/snippet}

<div style:width={`${width}px`}>
  {#if kind === 'vstack'}
    <VStack {as} {gap} {divider} data-testid="root" class="p-1">{@render three()}</VStack>
  {:else if kind === 'hstack'}
    <HStack {as} {gap} {divider} {responsive} data-testid="root">{@render three()}</HStack>
  {:else if kind === 'cluster'}
    <Cluster {as} {gap} data-testid="root">{@render three()}</Cluster>
  {:else if kind === 'grid'}
    <Grid {as} {gap} {minItem} data-testid="root">
      {#each Array.from({ length: 6 }, (_, index) => index) as index (index)}<div>Card {index}</div>{/each}
    </Grid>
  {:else if kind === 'spacer'}
    <HStack data-testid="root"><button type="button">Back</button><Spacer /><button type="button">Next</button></HStack>
  {:else}
    <Fits breakpoints={['48rem', '28rem']} data-testid="root" layouts={[row, column, menu]} />
  {/if}
</div>

{#snippet row()}<div data-testid="row"><button type="button">Save</button><button type="button">Share</button></div>{/snippet}
{#snippet column()}<div data-testid="column"><button type="button">Save</button><button type="button">Share</button></div>{/snippet}
{#snippet menu()}<div data-testid="menu"><button type="button">Save</button><button type="button">More</button></div>{/snippet}
