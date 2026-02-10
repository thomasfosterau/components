<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props
	export let centerX: number;
	export let centerY: number;
	export let radiusX: number;
	export let radiusY: number;
	export let fill: string | undefined = undefined;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	$: center = { x: centerX, y: centerY };
	
	$: {
		renderer.ellipse(center, radiusX, radiusY, fill, stroke, strokeWidth);
	}
</script>
