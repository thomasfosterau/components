<script lang="ts">
import { onMount } from 'svelte';
import { getChartContext } from '../core/index.js';
import { createScale, getNiceDomain } from '../scales/index.js';
import type { DataPoint } from '../types/index.js';

export let data: DataPoint[] = [];
export let x: string;
export let y: string;
export let fill: string = 'rgba(66, 153, 225, 0.3)';
export let stroke: string = '#4299e1';
export let strokeWidth: number = 2;
export let xScale: any = undefined;
export let yScale: any = undefined;

const chartContext = getChartContext();
const { renderer, width, height, margin } = chartContext;

onMount(() => {
drawArea();
});

function drawArea() {
if (!data || data.length === 0) return;

// Extract x and y values
const xValues = data.map(d => d[x] as number);
const yValues = data.map(d => d[y] as number);

// Use provided scales or create default ones
let finalXScale = xScale;
if (!finalXScale) {
finalXScale = createScale('linear');
finalXScale.domain(getNiceDomain(xValues, 0));
finalXScale.range([margin.left, width - margin.right]);
}

let finalYScale = yScale;
if (!finalYScale) {
finalYScale = createScale('linear');
finalYScale.domain(getNiceDomain(yValues, 0.1));
finalYScale.range([height - margin.bottom, margin.top]);
}

// Convert to pancake coordinates (0-100)
const points = data.map(d => {
const xPos = finalXScale(d[x] as number) as number;
const yPos = finalYScale(d[y] as number) as number;
return {
x: (xPos / width) * 100,
y: (yPos / height) * 100
};
});

const firstPoint = points[0];
const lastPoint = points[points.length - 1];
if (!firstPoint || !lastPoint) return;

// Fill the area under the curve
renderer.beginPath();
renderer.moveTo(firstPoint);

for (let i = 1; i < points.length; i++) {
const point = points[i];
if (point) renderer.lineTo(point);
}

// Close to bottom
renderer.lineTo({ x: lastPoint.x, y: ((height - margin.bottom) / height) * 100 });
renderer.lineTo({ x: firstPoint.x, y: ((height - margin.bottom) / height) * 100 });
renderer.closePath();
renderer.fill(fill);

// Draw the line on top
renderer.beginPath();
renderer.moveTo(firstPoint);

for (let i = 1; i < points.length; i++) {
const point = points[i];
if (point) renderer.lineTo(point);
}

renderer.stroke(stroke, strokeWidth);
}
</script>

<!-- Area component renders through the renderer, no template needed -->
