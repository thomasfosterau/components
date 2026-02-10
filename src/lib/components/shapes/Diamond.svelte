<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props - for a diamond shape centered at (centerX, centerY)
	export let centerX: number;
	export let centerY: number;
	export let width: number;
	export let height: number;
	export let fill: string | undefined = undefined;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	// Calculate diamond points
	$: points = [
		{ x: centerX, y: centerY - height / 2 }, // top
		{ x: centerX + width / 2, y: centerY }, // right
		{ x: centerX, y: centerY + height / 2 }, // bottom
		{ x: centerX - width / 2, y: centerY }  // left
	];
	
	$: {
		renderer.polygon(points, fill, stroke, strokeWidth);
	}
</script>
