<!--
  Storybook-only helper for the registry-free configuration: owns the bindable
  `open`, a button to set it, a handful of static rows and a fake asynchronous
  search that resolves on a timer and honours the abort signal — so the
  loading row, the latest-wins behaviour and the empty state can all be seen
  without a server. Lives outside `src/lib/`, so it never ships in `dist/`.
-->
<script lang="ts">
  import Button from '../../lib/ui/Button.svelte';
  import CommandPalette from '../../lib/search/CommandPalette.svelte';
  import type { CommandItem } from '../../lib/search/types.ts';

  interface Props {
    /** Off by default, to show bits-ui's own filtering over static rows. */
    withSearch?: boolean;
    /** How slowly the fake search settles. */
    latencyMs?: number;
  }

  let { withSearch = true, latencyMs = 600 }: Props = $props();

  let open = $state(false);
  let lastSelected = $state<string | undefined>();

  const items: readonly CommandItem[] = [
    { id: 'bed.create', label: 'New bed', group: 'actions', hint: 'in the current garden' },
    { id: 'plant.create', label: 'New plant', group: 'actions' },
    { id: 'nav.beds', label: 'Go to beds', group: 'navigation', hint: '/beds' },
    { id: 'nav.plants', label: 'Go to plants', group: 'navigation', hint: '/plants' },
  ];

  const CATALOGUE: readonly CommandItem[] = [
    { id: 'rosa-canina', label: 'Rosa canina', group: 'results', badge: 'species' },
    { id: 'rosa-rugosa', label: 'Rosa rugosa', group: 'results', badge: 'species' },
    { id: 'rosmarinus', label: 'Rosmarinus officinalis', group: 'results', badge: 'species' },
    { id: 'north-bed', label: 'North bed', group: 'results', badge: 'bed' },
  ];

  const onSearch = (query: string, signal: AbortSignal): Promise<readonly CommandItem[]> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(
          CATALOGUE.filter((row) => row.label.toLowerCase().includes(query.toLowerCase())),
        );
      }, latencyMs);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('superseded'));
      });
    });
</script>

<div class="flex flex-col items-start gap-3 p-4">
  <Button variant="outline" onclick={() => (open = true)}>Open the palette</Button>
  {#if withSearch}
    <p class="text-base-content/70 text-sm">Try “rosa” — the results arrive asynchronously.</p>
  {/if}
  {#if lastSelected !== undefined}
    <p class="text-base-content/70 text-sm">Last selected: {lastSelected}</p>
  {/if}
</div>

<CommandPalette
  bind:open
  {items}
  onSearch={withSearch ? onSearch : undefined}
  onSelect={(candidate) => (lastSelected = candidate.label)}
/>
