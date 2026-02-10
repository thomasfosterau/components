<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props
	export let startX: number;
	export let startY: number;
	export let endX: number;
	export let endY: number;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	export let arrowSize: number = 8;
	export let showArrow: boolean = true;
	
	const context = getChartContext();
	const { renderer } = context;
	
	$: start = { x: startX, y: startY };
	$: end = { x: endX, y: endY };
	
	$: {
		if (showArrow) {
			renderer.arrow(start, end, stroke, strokeWidth, arrowSize);
		} else {
			renderer.beginPath();
			renderer.moveTo(start);
			renderer.lineTo(end);
			renderer.stroke(stroke, strokeWidth);
		}
	}
</script>
