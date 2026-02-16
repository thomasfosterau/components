import type {
Renderer,
PancakePoint,
PancakeCoordinates,
TextOptions
} from '../types/index.js';

// Type guard for WebGPU support
function hasWebGPU(): boolean {
return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * WebGPU Renderer - foundation for GPU-accelerated rendering
 * Note: This is a basic structure. Full WebGPU implementation would require
 * shader programs, buffer management, and pipeline configuration.
 */
export class WebGPURenderer implements Renderer {
readonly type = 'webgpu' as const;
// @ts-expect-error - used by initialize
	private width: number = 0;
// @ts-expect-error - used by initialize
	private height: number = 0;
private device: any = null;
private context: any = null;
private canvas: HTMLCanvasElement | null = null;

// Render data
private commands: RenderCommand[] = [];

async init(canvas?: HTMLCanvasElement): Promise<void> {
if (!canvas) {
canvas = document.createElement('canvas');
}
this.canvas = canvas;

// Check for WebGPU support
if (!hasWebGPU()) {
console.warn('WebGPU not supported. Falling back to Canvas renderer.');
return;
}

try {
// Request GPU adapter and device
const nav = navigator as any;
const adapter = await nav.gpu.requestAdapter();
if (!adapter) {
console.warn('No WebGPU adapter found. Falling back to Canvas renderer.');
return;
}

this.device = await adapter.requestDevice();
this.context = canvas.getContext('webgpu');

if (this.context && this.device) {
this.context.configure({
device: this.device,
format: nav.gpu.getPreferredCanvasFormat(),
alphaMode: 'premultiplied'
});
}
} catch (error) {
console.warn('WebGPU initialization failed:', error);
}
}

initialize(width: number, height: number): void {
this.width = width;
this.height = height;

if (this.canvas) {
this.canvas.width = width;
this.canvas.height = height;
}
}

clear(): void {
this.commands = [];
}

beginPath(): void {
this.commands.push({ type: 'beginPath' });
}

moveTo(point: PancakePoint): void {
this.commands.push({ type: 'moveTo', point });
}

lineTo(point: PancakePoint): void {
this.commands.push({ type: 'lineTo', point });
}

closePath(): void {
this.commands.push({ type: 'closePath' });
}

stroke(color: string = '#000000', width: number = 1): void {
this.commands.push({ type: 'stroke', color, width });
}

fill(color: string = '#000000'): void {
this.commands.push({ type: 'fill', color });
}

circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void {
this.commands.push({ type: 'circle', point, radius, fill, stroke });
}

rect(coords: PancakeCoordinates, fill?: string, stroke?: string, strokeWidth?: number): void {
this.commands.push({ type: 'rect', coords, fill, stroke, strokeWidth });
}

text(point: PancakePoint, text: string, options: TextOptions = {}): void {
this.commands.push({ type: 'text', point, text, options });
}

ellipse(center: PancakePoint, radiusX: number, radiusY: number, fill?: string, stroke?: string, strokeWidth?: number): void {
this.commands.push({ type: 'ellipse', center, radiusX, radiusY, fill, stroke, strokeWidth });
}

roundedRect(coords: PancakeCoordinates, radius: number, fill?: string, stroke?: string, strokeWidth?: number): void {
this.commands.push({ type: 'roundedRect', coords, radius, fill, stroke, strokeWidth });
}

polygon(points: PancakePoint[], fill?: string, stroke?: string, strokeWidth?: number): void {
this.commands.push({ type: 'polygon', points, fill, stroke, strokeWidth });
}

bezierCurve(start: PancakePoint, cp1: PancakePoint, cp2: PancakePoint, end: PancakePoint, stroke?: string, strokeWidth?: number): void {
this.commands.push({ type: 'bezierCurve', start, cp1, cp2, end, stroke, strokeWidth });
}

arrow(start: PancakePoint, end: PancakePoint, stroke?: string, strokeWidth?: number, arrowSize?: number): void {
this.commands.push({ type: 'arrow', start, end, stroke, strokeWidth, arrowSize });
}

setOpacity(alpha: number): void {
this.commands.push({ type: 'opacity', alpha });
}

/**
 * Execute all rendering commands
 * In a full implementation, this would:
 * 1. Build vertex buffers from commands
 * 2. Create render pass
 * 3. Execute shaders
 * 4. Present to canvas
 */
async render(): Promise<void> {
if (!this.device || !this.context) {
console.warn('WebGPU not initialized');
return;
}

// TODO: Implement actual WebGPU rendering pipeline
// This would involve:
// - Converting commands to GPU buffers
// - Setting up render pipelines
// - Executing compute and render passes
// - Presenting to the canvas
}

getOutput(): HTMLCanvasElement | null {
return this.canvas;
}
}

type RenderCommand =
| { type: 'beginPath' }
| { type: 'moveTo'; point: PancakePoint }
| { type: 'lineTo'; point: PancakePoint }
| { type: 'closePath' }
| { type: 'stroke'; color: string; width: number }
| { type: 'fill'; color: string }
| { type: 'circle'; point: PancakePoint; radius: number; fill?: string; stroke?: string }
| { type: 'rect'; coords: PancakeCoordinates; fill?: string; stroke?: string; strokeWidth?: number }
| { type: 'text'; point: PancakePoint; text: string; options: TextOptions }
| { type: 'opacity'; alpha: number }
| { type: 'ellipse'; center: PancakePoint; radiusX: number; radiusY: number; fill?: string; stroke?: string; strokeWidth?: number }
| { type: 'roundedRect'; coords: PancakeCoordinates; radius: number; fill?: string; stroke?: string; strokeWidth?: number }
| { type: 'polygon'; points: PancakePoint[]; fill?: string; stroke?: string; strokeWidth?: number }
| { type: 'bezierCurve'; start: PancakePoint; cp1: PancakePoint; cp2: PancakePoint; end: PancakePoint; stroke?: string; strokeWidth?: number }
| { type: 'arrow'; start: PancakePoint; end: PancakePoint; stroke?: string; strokeWidth?: number; arrowSize?: number };
