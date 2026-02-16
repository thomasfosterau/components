<script lang="ts">
	import { onMount } from 'svelte';
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props - Multi-segment line connector (e.g., for orthogonal connections)
	export let points: PancakePoint[];
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	onMount(() => {
		if (points.length >= 2) {
			const firstPoint = points[0];
			if (firstPoint) {
				renderer.beginPath();
				renderer.moveTo(firstPoint);
				
				for (let i = 1; i < points.length; i++) {
					const point = points[i];
					if (point) {
						renderer.lineTo(point);
					}
				}
				
				renderer.stroke(stroke, strokeWidth);
			}
		}
	});
</script>
