<script lang="ts">
	import { onMount } from 'svelte';
	import { getChartContext } from '../core/index.js';
	import { createScale, getNiceDomain } from '../scales/index.js';
	import type { DataPoint } from '../types/index.js';

	interface Props {
		data: DataPoint[];
		x: string;
		y: string;
		fill?: string;
		stroke?: string;
		radius?: number;
	}

	let {
		data = [],
		x,
		y,
		fill = '#4299e1',
		stroke,
		radius = 4
	}: Props = $props();

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
