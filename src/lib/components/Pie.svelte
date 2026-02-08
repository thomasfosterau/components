<script lang="ts">
	import { onMount } from 'svelte';
	import { getChartContext } from '../core/index.js';
	import { pie as d3Pie, arc as d3Arc } from 'd3-shape';
	import type { DataPoint } from '../types/index.js';

	export let data: DataPoint[] = [];
	export let valueKey: string = 'value';
	export let labelKey: string = 'label';
	export let colors: string[] = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac'];
	export let innerRadius: number = 0; // Set > 0 for donut chart
	export let showLabels: boolean = true;

	const chartContext = getChartContext();
	const { renderer, width, height, margin } = chartContext;

	onMount(() => {
		drawPie();
	});

	function drawPie() {
		if (!data || data.length === 0) return;

		// Calculate center and radius
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right, margin.bottom, margin.left);

		// Create pie layout
		const pieGenerator = d3Pie<DataPoint>()
			.value(d => d[valueKey] as number);

		const arcGenerator = d3Arc()
			.innerRadius(innerRadius)
			.outerRadius(radius);

		const arcs = pieGenerator(data);

		// Draw each slice
		arcs.forEach((arc, i) => {
			const color = colors[i % colors.length];
			const centroid = arcGenerator.centroid(arc as any);

			// Draw the arc slice
			const pathData = arcGenerator(arc as any);
			if (pathData) {
				// Convert SVG path to renderer commands (simplified approach)
				// In a full implementation, this would parse the path and convert to renderer primitives
				// For now, we'll draw a simple wedge using beginPath/moveTo/lineTo
				
				const startAngle = arc.startAngle;
				const endAngle = arc.endAngle;
				const segments = 20; // Number of segments for smooth arc
				
				renderer.beginPath();
				
				// Move to center (or inner radius)
				const startX = centerX + Math.cos(startAngle) * innerRadius;
				const startY = centerY + Math.sin(startAngle) * innerRadius;
				renderer.moveTo({ x: (startX / width) * 100, y: (startY / height) * 100 });
				
				// Draw outer arc
				for (let j = 0; j <= segments; j++) {
					const angle = startAngle + (endAngle - startAngle) * (j / segments);
					const x = centerX + Math.cos(angle) * radius;
					const y = centerY + Math.sin(angle) * radius;
					renderer.lineTo({ x: (x / width) * 100, y: (y / height) * 100 });
				}
				
				// If donut, draw inner arc back
				if (innerRadius > 0) {
					for (let j = segments; j >= 0; j--) {
						const angle = startAngle + (endAngle - startAngle) * (j / segments);
						const x = centerX + Math.cos(angle) * innerRadius;
						const y = centerY + Math.sin(angle) * innerRadius;
						renderer.lineTo({ x: (x / width) * 100, y: (y / height) * 100 });
					}
				}
				
				renderer.closePath();
				renderer.fill(color);
				renderer.stroke('#fff', 2);
			}

			// Draw labels
			if (showLabels && data[i]) {
				const labelX = centerX + centroid[0];
				const labelY = centerY + centroid[1];
				const label = data[i][labelKey] as string;
				
				renderer.text(
					{ x: (labelX / width) * 100, y: (labelY / height) * 100 },
					label,
					{ fontSize: 12, textAnchor: 'middle', fill: '#fff', fontWeight: 'bold' }
				);
			}
		});
	}
</script>

<!-- Pie component renders through the renderer, no template needed -->
