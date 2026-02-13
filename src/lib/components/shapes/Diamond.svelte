<script lang="ts">
	import { onMount } from 'svelte';
	import { getChartContext } from '../../core/context.js';
	
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
	
	onMount(() => {
		// Calculate diamond points
		const points = [
			{ x: centerX, y: centerY - height / 2 }, // top
			{ x: centerX + width / 2, y: centerY }, // right
			{ x: centerX, y: centerY + height / 2 }, // bottom
			{ x: centerX - width / 2, y: centerY }  // left
		];
		
		renderer.polygon(points, fill, stroke, strokeWidth);
	});
</script>
