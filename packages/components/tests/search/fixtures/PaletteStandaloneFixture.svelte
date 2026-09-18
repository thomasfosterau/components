<!-- The palette with NO hotkey registry above it: opened through the bindable
     `open`, rows from `items`, and an async `onSearch` the test controls. This
     is the configuration that has to work for an app that wants a palette but
     not a hotkey system. -->
<script lang="ts">
  import CommandPalette from '../../../src/lib/search/CommandPalette.svelte';
  import type { CommandItem } from '../../../src/lib/search/types.ts';

  interface Props {
    open?: boolean;
    items?: readonly CommandItem[] | undefined;
    onSearch?:
      | ((query: string, signal: AbortSignal) => Promise<readonly CommandItem[]>)
      | undefined;
    debounceMs?: number | undefined;
  }

  let { open = $bindable(false), items, onSearch, debounceMs = 20 }: Props = $props();

  let selected = $state<string[]>([]);
</script>

<button type="button" onclick={() => (open = true)}>Open the palette</button>
<p data-testid="open-state">{open ? 'open' : 'closed'}</p>
<ul data-testid="selected">
  {#each selected as id, index (index)}
    <li data-testid="selected-id">{id}</li>
  {/each}
</ul>

<CommandPalette
  bind:open
  {items}
  {onSearch}
  {debounceMs}
  onSelect={(candidate) => (selected = [...selected, candidate.id])}
/>
