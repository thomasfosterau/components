<script lang="ts">
import { onMount } from 'svelte';
import { getChartContext } from '../core/index.js';
import { createScale, getNiceDomain } from '../scales/index.js';
import type { DataPoint } from '../types/index.js';

export let data: DataPoint[] = [];
export let x: string;
export let y: string;
export let fill: string = '#4299e1';
export let stroke: string | undefined = undefined;
export let radius: number = 4;

const chartContext = getChartContext();
const { renderer, width, height, margin } = chartContext;

onMount(() => {
drawScatter();
});

function drawScatter() {
if (!data || data.length === 0) return;

// Extract x and y values
const xValues = data.map(d => d[x] as number);
const yValues = data.map(d => d[y] as number);

// Create scales
const xScale = createScale('linear')
.domain(getNiceDomain(xValues, 0.1))
.range([margin.left, width - margin.right]);

const yScale = createScale('linear')
.domain(getNiceDomain(yValues, 0.1))
.range([height - margin.bottom, margin.top]);

// Draw points
data.forEach(d => {
const xPos = xScale(d[x] as number) as number;
const yPos = yScale(d[y] as number) as number;

const point = {
x: (xPos / width) * 100,
y: (yPos / height) * 100
};

renderer.circle(point, radius, fill, stroke);
});
}
</script>

<!-- Scatter component renders through the renderer, no template needed -->
