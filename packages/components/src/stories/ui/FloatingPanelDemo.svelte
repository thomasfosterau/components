<script lang="ts">
  import FloatingPanel from '../../lib/ui/FloatingPanel.svelte';
  import type { PanelStage } from '../../lib/ui/floating-panel.ts';

  interface Props {
    /** Show a second panel to try stacking and F6. */
    second?: boolean | undefined;
    /** The first panel's starting stage. */
    stage?: PanelStage | undefined;
  }

  let { second = false, stage = 'default' }: Props = $props();

  let boundary: HTMLDivElement | undefined = $state();
  const layers = ['Roads', 'Rivers', 'Contours', 'Labels'];
</script>

<div
  bind:this={boundary}
  class="bg-base-200 border-base-300 relative h-[28rem] overflow-hidden rounded-box border"
  style="background-image: radial-gradient(var(--color-base-300) 1px, transparent 1px); background-size: 16px 16px;"
>
  <p class="text-base-content/70 p-4 text-sm">Canvas: the page behind stays usable.</p>
  {#if boundary}
    <FloatingPanel title="Layers" {boundary} {stage} rect={{ x: 24, y: 56, width: 220, height: 200 }}>
      <ul class="space-y-1">
        {#each layers as layer (layer)}
          <li><label class="flex items-center gap-2"><input type="checkbox" class="checkbox checkbox-sm" checked /> {layer}</label></li>
        {/each}
      </ul>
    </FloatingPanel>
    {#if second}
      <FloatingPanel title="Legend" {boundary} rect={{ x: 300, y: 120, width: 220, height: 180 }}>
        <p class="text-sm">Contours every 10 m. Press F6 to move between panels and the page.</p>
      </FloatingPanel>
    {/if}
  {/if}
</div>
