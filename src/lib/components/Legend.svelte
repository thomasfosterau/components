<script lang="ts">
	import { onMount } from 'svelte';
	import { getChartContext } from '../core/index.js';
	import type { LegendItem } from '../types/index.js';

	export let items: LegendItem[] = [];
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'right';
	export let itemSpacing: number = 20;
	export let shapeSize: number = 10;

	const chartContext = getChartContext();
	const { renderer, width, height } = chartContext;

	onMount(() => {
		drawLegend();
	});

	function drawLegend() {
		if (!items || items.length === 0) return;

		let x = 0;
		let y = 0;

		// Calculate starting position based on legend position
		switch (position) {
			case 'top':
				x = width / 2 - (items.length * (shapeSize + itemSpacing * 4)) / 2;
				y = 10;
				break;
			case 'bottom':
				x = width / 2 - (items.length * (shapeSize + itemSpacing * 4)) / 2;
				y = height - 30;
				break;
			case 'left':
				x = 10;
				y = height / 2 - (items.length * itemSpacing) / 2;
				break;
			case 'right':
				x = width - 100;
				y = height / 2 - (items.length * itemSpacing) / 2;
				break;
		}

		const isHorizontal = position === 'top' || position === 'bottom';

		items.forEach((item, i) => {
			const currentX = isHorizontal ? x + i * (shapeSize + itemSpacing * 4) : x;
			const currentY = isHorizontal ? y : y + i * itemSpacing;

			// Draw shape
			const shapeX = (currentX / width) * 100;
			const shapeY = (currentY / height) * 100;

			switch (item.shape || 'square') {
				case 'circle':
					renderer.circle(
						{ x: shapeX + (shapeSize / width) * 50, y: shapeY + (shapeSize / height) * 50 },
						shapeSize / 2,
						item.color
					);
					break;
				case 'line':
					renderer.beginPath();
					renderer.moveTo({ x: shapeX, y: shapeY + (shapeSize / 2 / height) * 100 });
					renderer.lineTo({ x: shapeX + (shapeSize / width) * 100, y: shapeY + (shapeSize / 2 / height) * 100 });
					renderer.stroke(item.color, 2);
					break;
				case 'square':
				default:
					renderer.rect(
						{
							x1: shapeX,
							y1: shapeY,
							x2: shapeX + (shapeSize / width) * 100,
							y2: shapeY + (shapeSize / height) * 100
						},
						item.color
					);
					break;
			}

			// Draw label
			const labelX = ((currentX + shapeSize + 5) / width) * 100;
			const labelY = ((currentY + shapeSize / 2 + 3) / height) * 100;
			
			renderer.text(
				{ x: labelX, y: labelY },
				item.label,
				{ fontSize: 11, textAnchor: 'start', fill: '#333' }
			);
		});
	}
</script>

<!-- Legend component renders through the renderer, no template needed -->
