<script lang="ts">
import { onMount } from 'svelte';
import { getChartContext } from '../core/index.js';
import { getTicks, formatTick } from '../scales/index.js';
import type { ScaleType } from '../types/index.js';

export let scale: any; // D3 scale
export let scaleType: ScaleType = 'linear';
export let type: 'x' | 'y' = 'x';
export let position: 'top' | 'bottom' | 'left' | 'right' = type === 'x' ? 'bottom' : 'left';
export let label: string = '';
export let tickCount: number = 10;
export let tickFormat: ((value: unknown) => string) | undefined = undefined;
export let gridLines: boolean = false;

const chartContext = getChartContext();
const { renderer, width, height, margin } = chartContext;

onMount(() => {
drawAxis();
});

function drawAxis() {
if (!scale) return;

const domain = scale.domain();
const ticks = getTicks(domain, tickCount);

const isXAxis = type === 'x';
const axisY = position === 'bottom' ? height - margin.bottom : margin.top;
const axisX = position === 'right' ? width - margin.right : margin.left;

// Draw axis line
if (isXAxis) {
renderer.beginPath();
renderer.moveTo({ x: (margin.left / width) * 100, y: (axisY / height) * 100 });
renderer.lineTo({ x: ((width - margin.right) / width) * 100, y: (axisY / height) * 100 });
renderer.stroke('#000', 1);
} else {
renderer.beginPath();
renderer.moveTo({ x: (axisX / width) * 100, y: (margin.top / height) * 100 });
renderer.lineTo({ x: (axisX / width) * 100, y: ((height - margin.bottom) / height) * 100 });
renderer.stroke('#000', 1);
}

// Draw ticks and labels
ticks.forEach(tick => {
const scaledValue = scale(tick);

if (isXAxis) {
const x = (scaledValue / width) * 100;
const y = (axisY / height) * 100;

// Tick mark
renderer.beginPath();
renderer.moveTo({ x, y });
renderer.lineTo({ x, y: y + 1 });
renderer.stroke('#000', 1);

// Label
const tickLabel = tickFormat ? tickFormat(tick) : formatTick(tick, scaleType);
renderer.text(
{ x, y: y + 2 },
tickLabel,
{ fontSize: 10, textAnchor: 'middle', fill: '#000' }
);

// Grid lines
if (gridLines) {
renderer.beginPath();
renderer.moveTo({ x, y: (margin.top / height) * 100 });
renderer.lineTo({ x, y: ((height - margin.bottom) / height) * 100 });
renderer.stroke('#e0e0e0', 1);
}
} else {
const x = (axisX / width) * 100;
const y = (scaledValue / height) * 100;

// Tick mark
renderer.beginPath();
renderer.moveTo({ x, y });
renderer.lineTo({ x: x - 1, y });
renderer.stroke('#000', 1);

// Label
const tickLabel = tickFormat ? tickFormat(tick) : formatTick(tick, scaleType);
renderer.text(
{ x: x - 2, y },
tickLabel,
{ fontSize: 10, textAnchor: 'end', fill: '#000' }
);

// Grid lines
if (gridLines) {
renderer.beginPath();
renderer.moveTo({ x: (margin.left / width) * 100, y });
renderer.lineTo({ x: ((width - margin.right) / width) * 100, y });
renderer.stroke('#e0e0e0', 1);
}
}
});

// Draw axis label
if (label) {
if (isXAxis) {
const x = ((margin.left + (width - margin.right)) / 2 / width) * 100;
const y = ((height - 10) / height) * 100;
renderer.text(
{ x, y },
label,
{ fontSize: 12, textAnchor: 'middle', fill: '#000', fontWeight: 'bold' }
);
} else {
const x = (10 / width) * 100;
const y = ((margin.top + (height - margin.bottom)) / 2 / height) * 100;
renderer.text(
{ x, y },
label,
{ fontSize: 12, textAnchor: 'middle', fill: '#000', fontWeight: 'bold', rotation: -90 }
);
}
}
}
</script>

<!-- Axis component renders through the renderer, no template needed -->
