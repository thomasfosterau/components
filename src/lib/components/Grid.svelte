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
			const domain = xScale.domain();
			const step = (domain[1] - domain[0]) / (xTicks - 1);
			
			for (let i = 0; i < xTicks; i++) {
				const value = domain[0] + step * i;
				const x = xScale(value);
				
				if (x >= margin.left && x <= width - margin.right) {
					renderer.beginPath();
					renderer.moveTo({ x: (x / width) * 100, y: (margin.top / height) * 100 });
					renderer.lineTo({ x: (x / width) * 100, y: ((height - margin.bottom) / height) * 100 });
					renderer.stroke(color, strokeWidth);
				}
			}
		}

		// Draw horizontal grid lines
		if (showHorizontal && yScale) {
			const domain = yScale.domain();
			const step = (domain[1] - domain[0]) / (yTicks - 1);
			
			for (let i = 0; i < yTicks; i++) {
				const value = domain[0] + step * i;
				const y = yScale(value);
				
				if (y >= margin.top && y <= height - margin.bottom) {
					renderer.beginPath();
					renderer.moveTo({ x: (margin.left / width) * 100, y: (y / height) * 100 });
					renderer.lineTo({ x: ((width - margin.right) / width) * 100, y: (y / height) * 100 });
					renderer.stroke(color, strokeWidth);
				}
			}
		}
	}
</script>

<!-- Grid component renders through the renderer, no template needed -->
