<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LoadingBoundary from '../../lib/feedback/LoadingBoundary.svelte';
  import Card from '../../lib/ui/Card.svelte';
  import Skeleton from '../../lib/ui/Skeleton.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/LoadingBoundary',
    component: LoadingBoundary,
    parameters: {
      docs: {
        description: {
          component:
            'The chrome around one read. `loading` is a FIRST read with nothing to show; `refreshing` is a re-fetch over content already on screen, and keeps the children mounted — collapsing the two is what made every mutation blank its list back to “Loading…”.',
        },
      },
    },
  });
</script>

{#snippet beds()}
  <ul class="list-disc space-y-1 pl-5 text-sm">
    <li>North bed — 14 plants</li>
    <li>Glasshouse — 31 plants</li>
    <li>Orchard — 6 trees</li>
  </ul>
{/snippet}

<Story name="Ready">
  <LoadingBoundary state="ready">{@render beds()}</LoadingBoundary>
</Story>

<Story name="First read">
  <LoadingBoundary state="loading" loadingLabel="Loading beds…">{@render beds()}</LoadingBoundary>
</Story>

<Story name="Refreshing — children stay">
  <LoadingBoundary state="refreshing" loadingLabel="Refreshing beds…">
    {@render beds()}
  </LoadingBoundary>
</Story>

<Story name="Failed (page)">
  <LoadingBoundary state="error" errorLabel="The beds didn’t load. Try again.">
    {@render beds()}
  </LoadingBoundary>
</Story>

<Story name="Failed (section)">
  <Card title="Recent observations">
    <LoadingBoundary state="error" tone="section" errorLabel="Observations didn’t load.">
      {@render beds()}
    </LoadingBoundary>
  </Card>
</Story>

<Story name="A custom loading snippet">
  <LoadingBoundary state="loading">
    {#snippet loading()}
      <Skeleton variant="text" lines={3} label="Loading beds" />
    {/snippet}
    {@render beds()}
  </LoadingBoundary>
</Story>
