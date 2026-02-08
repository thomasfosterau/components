<script lang="ts">
import { onMount, afterUpdate } from 'svelte';
import type { RenderTarget, Margin } from '../types/index.js';
import { setChartContext, createRenderer } from '../core/index.js';

export let width: number = 600;
export let height: number = 400;
export let margin: Margin = { top: 20, right: 20, bottom: 40, left: 50 };
export let renderTarget: RenderTarget = 'svg';

let canvasElement: HTMLCanvasElement | undefined;
let svgContent = '';
let renderer: any;

onMount(() => {
// Create renderer after canvasElement is bound (for canvas/webgpu targets)
const createdRenderer = createRenderer(renderTarget, canvasElement);
renderer = createdRenderer;

// Set up chart context for child components with the initialized renderer
setChartContext({
renderer: createdRenderer,
width,
height,
margin,
renderTarget
});

createdRenderer.initialize(width, height);

if (renderTarget === 'svg') {
svgContent = (createdRenderer.getOutput() as string) || '';
}
});

afterUpdate(() => {
// Update SVG content after child components have rendered
if (renderTarget === 'svg' && renderer) {
svgContent = (renderer.getOutput() as string) || '';
}
});
</script>

<div class="chart-container" style="width: {width}px; height: {height}px;">
{#if renderTarget === 'svg'}
{@html svgContent}
{:else if renderTarget === 'canvas'}
<canvas bind:this={canvasElement} {width} {height}></canvas>
{:else if renderTarget === 'webgpu'}
<canvas bind:this={canvasElement} {width} {height}></canvas>
{/if}

<slot />
</div>

<style>
.chart-container {
position: relative;
display: inline-block;
}

:global(.chart-container svg),
:global(.chart-container canvas) {
display: block;
}
</style>
