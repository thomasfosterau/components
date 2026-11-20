<script lang="ts">
  import { tick } from 'svelte';
  import NavigationStack from '../../lib/layout/NavigationStack.svelte';
  import StackPage from '../../lib/layout/StackPage.svelte';
  import { createNavigationStack } from '../../lib/layout/stack-direction.svelte.ts';

  interface Props {
    /** Lay the stack out right to left. */
    rtl?: boolean | undefined;
  }

  let { rtl = false }: Props = $props();

  // A stand-in router for the story: screens are paths under a fake origin.
  const stack = createNavigationStack();
  const beds = [
    { id: '3', name: 'Bed 3', plantings: ['Tomato', 'Basil'] },
    { id: '4', name: 'Bed 4', plantings: ['Carrot', 'Radish', 'Pea'] },
  ];
  let path = $state('/beds');
  const parts = $derived(path.split('/').filter(Boolean));
  const bed = $derived(beds.find((candidate) => candidate.id === parts[1]));

  const go = async (to: string): Promise<void> => {
    const { promise: complete, resolve } = Promise.withResolvers<void>();
    const wait = stack.onNavigate({ type: 'link', to: { url: new URL(to, 'https://example.test') }, complete });
    if (wait) await wait;
    path = to;
    await tick();
    resolve();
  };

  const onclick = (event: MouseEvent): void => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link) return;
    event.preventDefault();
    void go(link.getAttribute('href') ?? '/beds');
  };
</script>

<div dir={rtl ? 'rtl' : undefined} class="max-w-sm">
  <NavigationStack {onclick} class="bg-base-100 rounded-box border-base-300 min-h-80 border p-4">
    {#key path}
      {#if parts.length === 3 && bed}
        <StackPage title={parts[2] ?? ''} backHref={`/beds/${bed.id}`}>
          <p class="text-base-content/70">Sown 12 October. Water every second day.</p>
        </StackPage>
      {:else if bed}
        <StackPage title={bed.name} backHref="/beds">
          <ul class="menu bg-base-200 rounded-box w-full">
            {#each bed.plantings as planting (planting)}
              <li><a href={`/beds/${bed.id}/${planting}`}>{planting}</a></li>
            {/each}
          </ul>
        </StackPage>
      {:else}
        <StackPage title="Beds" href="/beds">
          <ul class="menu bg-base-200 rounded-box w-full">
            {#each beds as item (item.id)}
              <li><a href={`/beds/${item.id}`}>{item.name}</a></li>
            {/each}
          </ul>
        </StackPage>
      {/if}
    {/key}
  </NavigationStack>
</div>
