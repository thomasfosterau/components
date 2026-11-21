<!-- A filter group, an assist row with a link under a base-path context, and a suggestion. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import ActionChip from '../../../src/lib/ui/ActionChip.svelte';
  import ChipGroup from '../../../src/lib/ui/ChipGroup.svelte';

  let annuals = $state(false);
  let reply = $state('');

  setComponentsContext({ href: (path) => `/base${path}` });
</script>

{#snippet pin()}<svg viewBox="0 0 16 16" data-testid="pin"><path d="M8 1v14" /></svg>{/snippet}

<ChipGroup label="Plant type">
  <ActionChip kind="filter" bind:selected={annuals}>Annuals</ActionChip>
  <ActionChip kind="filter" selected>Perennials</ActionChip>
</ChipGroup>
<span data-testid="annuals">{annuals}</span>

<ChipGroup label="Actions">
  <ActionChip href="/directions" icon={pin}>Directions</ActionChip>
  <ActionChip onclick={() => (reply = 'shared')}>Share</ActionChip>
</ChipGroup>

<ActionChip kind="suggestion" onclick={() => (reply = 'Solanum')}>Did you mean Solanum?</ActionChip>
<span data-testid="reply">{reply}</span>
