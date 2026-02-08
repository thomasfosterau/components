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
		barWidth?: number;
	}

	let {
		data = [],
		x,
		y,
		fill = '#4299e1',
		stroke,
		barWidth = 0.8
	}: Props = $props();

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

		// Create scales
		const xScale = createScale('band')
			.domain(xValues)
			.range([margin.left, width - margin.right])
			.padding(1 - barWidth);

		const yScale = createScale('linear')
			.domain([0, Math.max(...yValues)])
			.range([height - margin.bottom, margin.top]);

		const bandwidth = xScale.bandwidth();

		// Draw bars
		data.forEach((d) => {
			const xPos = xScale(d[x] as string) as number;
			const yPos = yScale(d[y] as number) as number;
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
