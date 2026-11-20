<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PullToRefresh from '../../lib/data/PullToRefresh.svelte';

  const { Story } = defineMeta({
    title: 'Data/PullToRefresh',
    component: PullToRefresh,
    parameters: {
      docs: {
        description: {
          component:
            'Pull down from the top of the list on a touch screen (or in device emulation) to refresh. The Refresh button does the same without the gesture: visible with a mouse, visually hidden until focused on touch, and always there for screen-reader users.',
        },
      },
    },
  });

  const plants = ['Basil', 'Coriander', 'Dill', 'Fennel', 'Lovage', 'Mint', 'Oregano', 'Parsley', 'Rosemary', 'Sage', 'Sorrel', 'Tarragon', 'Thyme'];

  /** Waits, then resolves, unless the signal aborts first. */
  function wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
  }
</script>

<script lang="ts">
  let refreshedAt = $state('never');
  let failures = $state(0);
</script>

{#snippet list(note: string)}
  <p class="text-base-content/70 px-2 text-sm">{note}</p>
  <ul class="divide-base-300 divide-y">
    {#each plants as plant (plant)}
      <li class="px-2 py-3">{plant}</li>
    {/each}
  </ul>
{/snippet}

<Story name="Planting log" asChild>
  <PullToRefresh
    class="border-base-300 rounded-box h-96 border"
    onRefresh={async (signal) => {
      await wait(1200, signal);
      refreshedAt = new Date().toLocaleTimeString();
    }}
  >
    {@render list(`Last refreshed: ${refreshedAt}`)}
  </PullToRefresh>
</Story>

<Story name="Refresh that fails" asChild>
  <!-- The component resets and announces nothing; reporting the error (a toast) is the caller's job. -->
  <PullToRefresh
    class="border-base-300 rounded-box h-96 border"
    onRefresh={async (signal) => {
      await wait(800, signal);
      failures++;
      throw new Error('Offline');
    }}
  >
    {@render list(`Failed refreshes: ${failures}`)}
  </PullToRefresh>
</Story>

<Story name="Button always shown" asChild>
  <PullToRefresh
    class="border-base-300 rounded-box h-96 border"
    showButton
    onRefresh={(signal) => wait(800, signal)}
  >
    {@render list('The button shows on touch screens too.')}
  </PullToRefresh>
</Story>
