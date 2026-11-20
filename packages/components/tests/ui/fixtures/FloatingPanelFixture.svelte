<script lang="ts">
  import { untrack } from 'svelte';
  import FloatingPanel from '../../../src/lib/ui/FloatingPanel.svelte';
  import type { PanelRect, PanelStage } from '../../../src/lib/ui/floating-panel.ts';

  interface Props {
    second?: boolean | undefined;
    initiallyOpen?: boolean | undefined;
  }

  let { second = false, initiallyOpen = true }: Props = $props();

  let boundary: HTMLDivElement | undefined = $state();
  let open = $state(untrack(() => initiallyOpen));
  let rect: PanelRect = $state({ x: 100, y: 100, width: 200, height: 150 });
  let stage: PanelStage = $state('default');
  let clicks = $state(0);
</script>

<button type="button" onclick={() => (open = true)}>Show layers</button>
<button type="button" onclick={() => (clicks += 1)}>Behind ({clicks})</button>
<output data-testid="rect">{rect.x},{rect.y},{rect.width},{rect.height}</output>
<output data-testid="stage">{stage}</output>

<div bind:this={boundary} style="position: relative; width: 600px; height: 400px;">
  {#if boundary}
    <FloatingPanel title="Layers" {boundary} bind:open bind:rect bind:stage>
      <button type="button">Roads</button>
    </FloatingPanel>
    {#if second}
      <FloatingPanel title="Legend" {boundary} rect={{ x: 300, y: 200, width: 200, height: 150 }}>
        <button type="button">Key</button>
      </FloatingPanel>
    {/if}
  {/if}
</div>
