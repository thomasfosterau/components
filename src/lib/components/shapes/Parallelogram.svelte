<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	import type { PancakePoint } from '../../types/index.js';
	
	// Component props - for a parallelogram (input/output shape in flowcharts)
	export let x1: number;
	export let y1: number;
	export let x2: number;
	export let y2: number;
	export let skew: number = 10; // horizontal skew amount (as percentage)
	export let fill: string | undefined = undefined;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	
	const context = getChartContext();
	const { renderer } = context;
	
	// Calculate parallelogram points
	$: points = [
		{ x: x1 + skew, y: y1 }, // top-left (skewed right)
		{ x: x2 + skew, y: y1 }, // top-right (skewed right)
		{ x: x2 - skew, y: y2 }, // bottom-right (skewed left)
		{ x: x1 - skew, y: y2 }  // bottom-left (skewed left)
	];
	
	$: {
		renderer.polygon(points, fill, stroke, strokeWidth);
	}
</script>
