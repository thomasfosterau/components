<!-- @component
`Cascader`'s search: a combobox input over a listbox of full paths, the matching text highlighted. Internal.
-->
<script lang="ts">
  import Highlight from '../formatting/Highlight.svelte';
  import type { CascaderNode } from './cascader.ts';

  interface Props {
    id: string;
    /** The search text. Bindable. */
    query: string;
    results: readonly (readonly CascaderNode[])[];
    busy: boolean;
    label: string;
    loadingLabel: string;
    noResultsLabel: string;
    /** Commit a result's path. */
    onChoose: (path: readonly CascaderNode[]) => void;
    /** ↓ with nothing typed: move into the columns. */
    onLeave: () => void;
  }

  let {
    id,
    query = $bindable(),
    results,
    busy,
    label,
    loadingLabel,
    noResultsLabel,
    onChoose,
    onLeave,
  }: Props = $props();

  const listId = $derived(`${id}-results`);
  const optionId = (index: number): string => `${id}-result-${index}`;
  const searching = $derived(query.trim() !== '');

  // The active index belongs to one result list; a new list starts at 0.
  let cursor = $state.raw<{ list: readonly (readonly CascaderNode[])[]; index: number }>({
    list: [],
    index: 0,
  });
  const active = $derived(cursor.list === results ? cursor.index : 0);

  const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

  const onkeydown = (event: KeyboardEvent): void => {
    const step = steps[event.key];
    if (!searching) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        onLeave();
      }
      return;
    }
    if (step !== undefined) {
      event.preventDefault();
      const index = Math.min(Math.max(active + step, 0), Math.max(results.length - 1, 0));
      cursor = { list: results, index };
      document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const path = results[active];
      if (path !== undefined) onChoose(path);
    }
  };
</script>

<input
  {id}
  type="search"
  role="combobox"
  class="input input-sm w-full"
  aria-label={label}
  aria-autocomplete="list"
  aria-expanded={searching}
  aria-controls={listId}
  aria-activedescendant={searching && results.length > 0 ? optionId(active) : undefined}
  autocomplete="off"
  bind:value={query}
  {onkeydown}
/>
<div
  id={listId}
  role="listbox"
  aria-label={label}
  aria-busy={busy ? 'true' : undefined}
  class={['max-h-72 overflow-y-auto py-1', !searching && 'hidden']}
>
  {#if busy}
    <div role="none" class="text-base-content/60 px-3 py-2">{loadingLabel}</div>
  {:else if results.length === 0}
    <div role="none" class="text-base-content/60 px-3 py-2">{noResultsLabel}</div>
  {/if}
  {#each results as path, index (path.map((node) => node.value).join('\u0000'))}
    <!-- Focus stays on the input (aria-activedescendant), which handles the keys. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
    <div
      id={optionId(index)}
      role="option"
      aria-selected={index === active}
      aria-label={path.map((node) => node.label).join(', ')}
      class={['cursor-default px-3 py-2', index === active && 'bg-base-200']}
      onclick={() => {
        onChoose(path);
      }}
    >
      {#each path as node, depth (node.value)}
        {#if depth > 0}<span class="text-base-content/50 px-1" aria-hidden="true">/</span>{/if}
        <Highlight text={node.label} {query} />
      {/each}
    </div>
  {/each}
</div>
