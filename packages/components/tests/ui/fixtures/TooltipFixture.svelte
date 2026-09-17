<!-- The Tooltip trigger spreads bits-ui's props onto a real button, which a
     `createRawSnippet` fragment cannot do. -->
<script lang="ts">
  import Tooltip from '../../../src/lib/ui/Tooltip.svelte';

  interface Props {
    text: string;
    triggerLabel: string;
    openDelay?: number;
  }

  let { text, triggerLabel, openDelay = 0 }: Props = $props();
</script>

<Tooltip {text} {openDelay}>
  {#snippet children({ props })}
    <button {...props} type="button">{triggerLabel}</button>
  {/snippet}
</Tooltip>
