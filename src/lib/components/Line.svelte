<script lang="ts">
import { onMount } from 'svelte';
import { getChartContext } from '../core/index.js';
import { createScale, getNiceDomain } from '../scales/index.js';
import type { DataPoint } from '../types/index.js';

export let data: DataPoint[] = [];
export let x: string;
export let y: string;
export let stroke: string = '#4299e1';
export let strokeWidth: number = 2;
export let fill: string | undefined = undefined;

const chartContext = getChartContext();
const { renderer, width, height, margin } = chartContext;

onMount(() => {
drawLine();
});

function drawLine() {
if (!data || data.length === 0) return;

// Extract x and y values
const xValues = data.map(d => d[x] as number);
const yValues = data.map(d => d[y] as number);

// Create scales
const xScale = createScale('linear')
.domain(getNiceDomain(xValues, 0))
.range([margin.left, width - margin.right]);

const yScale = createScale('linear')
.domain(getNiceDomain(yValues, 0.1))
.range([height - margin.bottom, margin.top]);

// Convert to pancake coordinates (0-100)
const points = data.map(d => {
const xPos = xScale(d[x] as number) as number;
const yPos = yScale(d[y] as number) as number;
return {
x: (xPos / width) * 100,
y: (yPos / height) * 100
};
});

// Draw the line
renderer.beginPath();
if (points[0]) renderer.moveTo(points[0]);

for (let i = 1; i < points.length; i++) {
if (points[i]) renderer.lineTo(points[i]);
}

renderer.stroke(stroke, strokeWidth);

// Optionally fill the area under the line
if (fill) {
renderer.beginPath();
if (points[0]) renderer.moveTo(points[0]);

for (let i = 1; i < points.length; i++) {
if (points[i]) renderer.lineTo(points[i]);
}

// Close to bottom
renderer.lineTo({ x: points[points.length - 1].x, y: ((height - margin.bottom) / height) * 100 });
renderer.lineTo({ x: points[0].x, y: ((height - margin.bottom) / height) * 100 });
renderer.closePath();
renderer.fill(fill);
}

// Draw points
points.forEach(point => {
if (point) renderer.circle(point, 3, stroke);
});
}
</script>

<!-- Line component renders through the renderer, no template needed -->
