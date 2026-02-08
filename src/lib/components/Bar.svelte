<script lang="ts">
import { onMount } from 'svelte';
import { getChartContext } from '../core/index.js';
import { createScale } from '../scales/index.js';
import type { DataPoint } from '../types/index.js';

export let data: DataPoint[] = [];
export let x: string;
export let y: string;
export let fill: string = '#4299e1';
export let stroke: string | undefined = undefined;
export let barWidth: number = 0.8;
export let xScale: any = undefined;
export let yScale: any = undefined;

const chartContext = getChartContext();
const { renderer, width, height, margin } = chartContext;

onMount(() => {
drawBars();
});

function drawBars() {
if (!data || data.length === 0) return;

// Extract x and y values
const xValues = data.map(d => d[x] as string);
const yValues = data.map(d => d[y] as number);

// Use provided scales or create default ones
let finalXScale = xScale;
if (!finalXScale) {
finalXScale = createScale('band');
finalXScale.domain(xValues);
finalXScale.range([margin.left, width - margin.right]);
finalXScale.padding(1 - barWidth);
}

let finalYScale = yScale;
if (!finalYScale) {
finalYScale = createScale('linear');
finalYScale.domain([0, Math.max(...yValues)]);
finalYScale.range([height - margin.bottom, margin.top]);
}

const bandwidth = finalXScale.bandwidth();

// Draw bars
data.forEach((d) => {
const xPos = finalXScale(d[x] as string) as number;
const yPos = finalYScale(d[y] as number) as number;
const barHeight = (height - margin.bottom) - yPos;

const coords = {
x1: (xPos / width) * 100,
y1: (yPos / height) * 100,
x2: ((xPos + bandwidth) / width) * 100,
y2: ((yPos + barHeight) / height) * 100
};

renderer.rect(coords, fill, stroke);
});
}
</script>

<!-- Bar component renders through the renderer, no template needed -->
