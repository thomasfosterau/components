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
case 'webgpu': {
// Attempt to use WebGPU when available and a canvas is provided.
const webgpuRenderer = new WebGPURenderer();

if (canvas && typeof navigator !== 'undefined' && 'gpu' in navigator) {
// Fire-and-forget async initialization; renderer will bind to the canvas when ready.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
void webgpuRenderer.init(canvas);
return webgpuRenderer;
}

// Fallback to CanvasRenderer if WebGPU is not available or no canvas is provided.
return new CanvasRenderer(canvas);
}
default:
return new SVGRenderer();
}
}
