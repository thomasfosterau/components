<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props - Multi-segment line connector (e.g., for orthogonal connections)
	export let points: PancakePoint[];
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	$: {
		if (points.length >= 2) {
			renderer.beginPath();
			renderer.moveTo(points[0]);
			
			for (let i = 1; i < points.length; i++) {
				renderer.lineTo(points[i]);
			}
			
			renderer.stroke(stroke, strokeWidth);
		}
	}
</script>
