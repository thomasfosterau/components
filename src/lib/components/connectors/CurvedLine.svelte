<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props - Bezier curve connector
	export let startX: number;
	export let startY: number;
	export let endX: number;
	export let endY: number;
	export let controlX1: number | undefined = undefined;
	export let controlY1: number | undefined = undefined;
	export let controlX2: number | undefined = undefined;
	export let controlY2: number | undefined = undefined;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	$: start = { x: startX, y: startY };
	$: end = { x: endX, y: endY };
	
	// Auto-calculate control points if not provided
	$: cp1 = controlX1 !== undefined && controlY1 !== undefined 
		? { x: controlX1, y: controlY1 }
		: { x: startX + (endX - startX) * 0.5, y: startY };
	
	$: cp2 = controlX2 !== undefined && controlY2 !== undefined
		? { x: controlX2, y: controlY2 }
		: { x: startX + (endX - startX) * 0.5, y: endY };
	
	$: {
		renderer.bezierCurve(start, cp1, cp2, end, stroke, strokeWidth);
	}
</script>
