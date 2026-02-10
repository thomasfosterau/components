<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props - for custom polygon shapes
	export let points: PancakePoint[];
	export let fill: string | undefined = undefined;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	$: {
		renderer.polygon(points, fill, stroke, strokeWidth);
	}
</script>
