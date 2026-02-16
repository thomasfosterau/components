<script lang="ts">
	import { onMount } from 'svelte';
	import { getChartContext } from '../../core/context.js';
	
	// Component props
	export let x: number;
	export let y: number;
	export let text: string;
	export let fontSize: number = 12;
	export let fontFamily: string = 'sans-serif';
	export let fontWeight: string | number = 'normal';
	export let textAnchor: 'start' | 'middle' | 'end' = 'middle';
	export let fill: string = '#000000';
	export let stroke: string | undefined = undefined;
	export let rotation: number | undefined = undefined;
	
	const context = getChartContext();
	const { renderer } = context;
	
	onMount(() => {
		const point = { x, y };
		
		const options = {
			fontSize,
			fontFamily,
			fontWeight,
			textAnchor,
			fill,
			stroke,
			rotation
		};
		
		renderer.text(point, text, options);
	});
</script>
