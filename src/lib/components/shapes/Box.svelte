<script lang="ts">
	import { getChartContext } from '../../core/context.js';
	
	// Component props
	export let x1: number;
	export let y1: number;
	export let x2: number;
	export let y2: number;
	export let fill: string | undefined = undefined;
	export let stroke: string = '#000000';
	export let strokeWidth: number = 2;
	export let rounded: boolean = false;
	export let radius: number = 5;
	
	const context = getChartContext();
	const { renderer } = context;
	
	$: coords = { x1, y1, x2, y2 };
	
	$: {
		if (rounded) {
			renderer.roundedRect(coords, radius, fill, stroke, strokeWidth);
		} else {
			renderer.rect(coords, fill, stroke);
		}
	}
</script>
