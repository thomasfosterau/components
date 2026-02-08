<script lang="ts">
import { onMount } from 'svelte';
import { getChartContext } from '../core/index.js';

export let xScale: any = undefined;
export let yScale: any = undefined;
export let xTicks: number = 10;
export let yTicks: number = 10;
export let color: string = '#e0e0e0';
export let strokeWidth: number = 1;
export let showVertical: boolean = true;
export let showHorizontal: boolean = true;

const chartContext = getChartContext();
const { renderer, width, height, margin } = chartContext;

onMount(() => {
drawGrid();
});

function drawGrid() {
// Draw vertical grid lines
if (showVertical && xScale) {
let tickValues: any[];

// Use scale's ticks if available, otherwise use domain
if (typeof xScale.ticks === 'function') {
tickValues = xScale.ticks(xTicks);
} else {
// For band/ordinal scales, sample from domain
const domain = xScale.domain();
tickValues = domain.filter((_: any, i: number) => i % Math.ceil(domain.length / xTicks) === 0);
}

tickValues.forEach((value: any) => {
const x = xScale(value);

if (x != null && x >= margin.left && x <= width - margin.right) {
renderer.beginPath();
renderer.moveTo({ x: (x / width) * 100, y: (margin.top / height) * 100 });
renderer.lineTo({ x: (x / width) * 100, y: ((height - margin.bottom) / height) * 100 });
renderer.stroke(color, strokeWidth);
}
});
}

// Draw horizontal grid lines
if (showHorizontal && yScale) {
let tickValues: any[];

// Use scale's ticks if available, otherwise use domain
if (typeof yScale.ticks === 'function') {
tickValues = yScale.ticks(yTicks);
} else {
// For band/ordinal scales, sample from domain
const domain = yScale.domain();
tickValues = domain.filter((_: any, i: number) => i % Math.ceil(domain.length / yTicks) === 0);
}

tickValues.forEach((value: any) => {
const y = yScale(value);

if (y != null && y >= margin.top && y <= height - margin.bottom) {
renderer.beginPath();
renderer.moveTo({ x: (margin.left / width) * 100, y: (y / height) * 100 });
renderer.lineTo({ x: ((width - margin.right) / width) * 100, y: (y / height) * 100 });
renderer.stroke(color, strokeWidth);
}
});
}
}
</script>

<!-- Grid component renders through the renderer, no template needed -->
