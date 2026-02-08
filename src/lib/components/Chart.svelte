<script lang="ts">
import { onMount } from 'svelte';
import type { RenderTarget, Margin } from '../types/index.js';
import { setChartContext, createRenderer } from '../core/index.js';

export let width: number = 600;
export let height: number = 400;
export let margin: Margin = { top: 20, right: 20, bottom: 40, left: 50 };
export let renderTarget: RenderTarget = 'svg';

let containerElement: HTMLDivElement;
let canvasElement: HTMLCanvasElement | undefined;
let svgContent = '';

const renderer = createRenderer(renderTarget, canvasElement);

// Set up chart context for child components
setChartContext({
renderer,
width,
height,
margin,
renderTarget
});

onMount(() => {
renderer.initialize(width, height);

if (renderTarget === 'svg') {
svgContent = (renderer.getOutput() as string) || '';
}
});

// Calculate inner dimensions (accounting for margins)
$: innerWidth = width - margin.left - margin.right;
$: innerHeight = height - margin.top - margin.bottom;
</script>

<div bind:this={containerElement} class="chart-container" style="width: {width}px; height: {height}px;">
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
