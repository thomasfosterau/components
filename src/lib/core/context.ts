import { setContext, getContext } from 'svelte';
import type { Renderer, RenderTarget, Margin } from '../types/index.js';
import { SVGRenderer } from '../renderers/svg.js';
import { CanvasRenderer } from '../renderers/canvas.js';
import { WebGPURenderer } from '../renderers/webgpu.js';

const CHART_CONTEXT_KEY = Symbol('chart-context');

export interface ChartContext {
	renderer: Renderer;
	width: number;
	height: number;
	margin: Margin;
	renderTarget: RenderTarget;
}

export function setChartContext(context: ChartContext) {
	setContext(CHART_CONTEXT_KEY, context);
}

export function getChartContext(): ChartContext {
	const context = getContext<ChartContext>(CHART_CONTEXT_KEY);
	if (!context) {
		throw new Error('Chart context not found. Make sure component is inside a Chart.');
	}
	return context;
}

export function createRenderer(target: RenderTarget, canvas?: HTMLCanvasElement): Renderer {
	switch (target) {
		case 'svg':
			return new SVGRenderer();
		case 'canvas':
			return new CanvasRenderer(canvas);
		case 'webgpu':
			return new WebGPURenderer();
		default:
			return new SVGRenderer();
	}
}
