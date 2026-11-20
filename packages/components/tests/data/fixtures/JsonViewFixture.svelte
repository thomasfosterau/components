<script lang="ts">
  import JsonView from '../../../src/lib/data/JsonView.svelte';

  interface Props {
    value: unknown;
    expandDepth?: number | undefined;
    hideRoot?: boolean | undefined;
    maxStringLength?: number | undefined;
    withRenderer?: boolean | undefined;
  }

  let { value, expandDepth, hideRoot, maxStringLength, withRenderer = false }: Props = $props();
</script>

{#snippet drawn({ value: item }: { value: unknown })}
  {#if typeof item === 'string' && item.startsWith('https://')}<cite data-testid="url">{item}</cite>{:else}{String(item)}{/if}
{/snippet}

<JsonView
  {value}
  {expandDepth}
  {hideRoot}
  {maxStringLength}
  renderValue={withRenderer ? drawn : undefined}
/>
