# Renderers

This document provides a deep dive into how the renderer system works in `@thomasfosterau/charts`, including implementation details for each renderer and guidance for creating custom renderers.

## Renderer Interface

All renderers implement the same `Renderer` interface, defined in `src/lib/types/index.ts`:

```typescript
interface Renderer {
  readonly type: RenderTarget;
  initialize(width: number, height: number): void;
  clear(): void;
  beginPath(): void;
  moveTo(point: PancakePoint): void;
  lineTo(point: PancakePoint): void;
  closePath(): void;
  stroke(color?: string, width?: number): void;
  fill(color?: string): void;
  circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void;
  rect(coords: PancakeCoordinates, fill?: string, stroke?: string): void;
  text(point: PancakePoint, text: string, options?: TextOptions): void;
  setOpacity(alpha: number): void;
  getOutput(): unknown;
}
```

This interface is inspired by the HTML5 Canvas API but adapted for:
1. **Pancake coordinates** instead of pixels
2. **Multi-target rendering** (SVG, Canvas, WebGPU)
3. **Declarative usage** from Svelte components

## SVG Renderer

**Location:** `src/lib/renderers/svg.ts`

### Overview

The SVG renderer generates SVG markup as strings, making it perfect for server-side rendering and static exports.

### Key Features

- ✅ **SSR Compatible**: No browser dependencies
- ✅ **Accessible**: SVG is screen-reader friendly
- ✅ **Scalable**: Vector graphics scale infinitely
- ✅ **Inspectable**: Generated SVG can be viewed/edited
- ⚠️ **Performance**: Slower than Canvas for large datasets (> 1000 points)

### Implementation Details

```typescript
export class SVGRenderer implements Renderer {
  readonly type = 'svg' as const;
  
  private width: number = 0;
  private height: number = 0;
  private elements: string[] = [];
  private currentPath: string = '';
  private currentOpacity: number = 1;
  
  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.elements = [];
  }
  
  clear(): void {
    this.elements = [];
  }
  
  private toPx(point: PancakePoint): [number, number] {
    return [
      (point.x / 100) * this.width,
      (point.y / 100) * this.height
    ];
  }
  
  moveTo(point: PancakePoint): void {
    const [x, y] = this.toPx(point);
    this.currentPath += `M ${x} ${y} `;
  }
  
  lineTo(point: PancakePoint): void {
    const [x, y] = this.toPx(point);
    this.currentPath += `L ${x} ${y} `;
  }
  
  stroke(color = '#000', width = 1): void {
    if (this.currentPath) {
      const opacity = this.currentOpacity !== 1 
        ? ` opacity="${this.currentOpacity}"` 
        : '';
      this.elements.push(
        `<path d="${this.currentPath}" ` +
        `stroke="${escapeHtml(color)}" ` +
        `stroke-width="${width}" ` +
        `fill="none"${opacity}/>`
      );
      this.currentPath = '';
    }
  }
  
  getOutput(): string {
    return `<svg width="${this.width}" height="${this.height}" ` +
           `xmlns="http://www.w3.org/2000/svg">` +
           this.elements.join('') +
           `</svg>`;
  }
}
```

### Security: XSS Prevention

The SVG renderer uses `escapeHtml()` to prevent XSS attacks:

```typescript
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

**Why this matters:**
```typescript
// Without escaping
const malicious = '<script>alert("XSS")</script>';
renderer.text({ x: 50, y: 50 }, malicious);
// Would output: <text>...><script>alert("XSS")</script></text>

// With escaping
// Outputs: <text>...>&lt;script&gt;alert("XSS")&lt;/script&gt;</text>
```

### Optimization: String Building

The SVG renderer accumulates elements in an array and joins them only when `getOutput()` is called:

```typescript
// ✅ Good: Append to array
this.elements.push('<circle ... />');

// ❌ Bad: String concatenation
this.output += '<circle ... />';  // Creates new string each time
```

This is significantly faster for charts with many elements.

### Output Format

```xml
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 200 L 100 150 L 200 180 ..." stroke="#4299e1" stroke-width="2" fill="none"/>
  <circle cx="300" cy="200" r="5" fill="#ed8936"/>
  <text x="50" y="380" font-size="12" fill="#000">Label</text>
</svg>
```

## Canvas Renderer

**Location:** `src/lib/renderers/canvas.ts`

### Overview

The Canvas renderer uses the HTML5 Canvas 2D API for high-performance rendering of dynamic visualizations.

### Key Features

- ✅ **High Performance**: Faster than SVG for large datasets
- ✅ **Immediate Mode**: Direct drawing, no DOM overhead
- ✅ **Compositing**: Built-in blend modes and effects
- ❌ **No SSR**: Requires browser environment
- ❌ **Not Accessible**: Canvas content is opaque to screen readers
- ❌ **Not Scalable**: Raster graphics, can be pixelated

### Implementation Details

```typescript
export class CanvasRenderer implements Renderer {
  readonly type = 'canvas' as const;
  
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  
  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  clear(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }
  
  private toPx(point: PancakePoint): [number, number] {
    return [
      (point.x / 100) * this.width,
      (point.y / 100) * this.height
    ];
  }
  
  beginPath(): void {
    this.ctx?.beginPath();
  }
  
  moveTo(point: PancakePoint): void {
    const [x, y] = this.toPx(point);
    this.ctx?.moveTo(x, y);
  }
  
  lineTo(point: PancakePoint): void {
    const [x, y] = this.toPx(point);
    this.ctx?.lineTo(x, y);
  }
  
  stroke(color = '#000', width = 1): void {
    if (this.ctx) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.stroke();
    }
  }
  
  fill(color = '#000'): void {
    if (this.ctx) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
  }
  
  getOutput(): HTMLCanvasElement | null {
    return this.canvas;
  }
}
```

### Performance Optimizations

#### 1. Batching

The Canvas API allows batching multiple shapes in one path:

```typescript
// ✅ Good: Single path for multiple lines
ctx.beginPath();
for (const point of points) {
  ctx.lineTo(point.x, point.y);
}
ctx.stroke();

// ❌ Bad: Individual paths
for (const point of points) {
  ctx.beginPath();
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}
```

#### 2. State Management

Minimize state changes:

```typescript
// ✅ Good: Batch by color
ctx.fillStyle = 'red';
for (const point of redPoints) {
  ctx.fillRect(point.x, point.y, 5, 5);
}
ctx.fillStyle = 'blue';
for (const point of bluePoints) {
  ctx.fillRect(point.x, point.y, 5, 5);
}

// ❌ Bad: Frequent state changes
for (const point of points) {
  ctx.fillStyle = point.color; // Change for each point
  ctx.fillRect(point.x, point.y, 5, 5);
}
```

#### 3. Offscreen Canvas

For static elements, use offscreen canvas:

```typescript
const offscreen = document.createElement('canvas');
const offscreenCtx = offscreen.getContext('2d');

// Draw static grid to offscreen canvas
drawGrid(offscreenCtx);

// Copy to main canvas
ctx.drawImage(offscreen, 0, 0);

// Only redraw dynamic elements
drawData(ctx);
```

### High-DPI Support

For sharp rendering on retina displays:

```typescript
initialize(width: number, height: number): void {
  const dpr = window.devicePixelRatio || 1;
  
  this.canvas.width = width * dpr;
  this.canvas.height = height * dpr;
  this.canvas.style.width = width + 'px';
  this.canvas.style.height = height + 'px';
  
  this.ctx.scale(dpr, dpr);
}
```

## WebGPU Renderer

**Location:** `src/lib/renderers/webgpu.ts`

### Overview

The WebGPU renderer leverages GPU compute for ultra-high-performance rendering, especially beneficial for very large datasets.

### Key Features

- ✅ **GPU Accelerated**: Orders of magnitude faster for large datasets
- ✅ **Parallel Processing**: Thousands of points processed simultaneously
- ✅ **Modern API**: Uses latest graphics standards
- ⚠️ **Experimental**: Not all features implemented
- ❌ **Limited Browser Support**: Chrome 113+, Safari 18+
- ❌ **Complex Setup**: Requires shader programming

### Current Status

The WebGPU renderer is currently experimental with basic functionality:

```typescript
export class WebGPURenderer implements Renderer {
  readonly type = 'webgpu' as const;
  
  private device: GPUDevice | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: GPUCanvasContext | null = null;
  
  async initialize(width: number, height: number): Promise<void> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }
    
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No GPU adapter found');
    }
    
    this.device = await adapter.requestDevice();
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.context = this.canvas.getContext('webgpu');
    this.context?.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    });
  }
  
  // ... other methods
}
```

### Shader Example

WebGPU uses WGSL (WebGPU Shading Language):

```wgsl
// Vertex shader
struct VertexInput {
  @location(0) position: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
}

@vertex
fn vertex_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  // Convert Pancake coordinates (0-100) to NDC (-1 to 1)
  output.position = vec4<f32>(
    (input.position.x / 50.0) - 1.0,
    1.0 - (input.position.y / 50.0),
    0.0,
    1.0
  );
  return output;
}

// Fragment shader
@fragment
fn fragment_main() -> @location(0) vec4<f32> {
  return vec4<f32>(0.0, 0.5, 1.0, 1.0); // Blue color
}
```

### Future WebGPU Features

Planned enhancements:
1. **Compute shaders** for data aggregation
2. **Texture-based rendering** for heatmaps
3. **Instanced rendering** for scatter plots
4. **GPU-based sorting** for large datasets

## Renderer Factory

**Location:** `src/lib/renderers/index.ts`

The factory pattern simplifies renderer creation:

```typescript
export function createRenderer(type: RenderTarget): Renderer {
  switch (type) {
    case 'svg':
      return new SVGRenderer();
    case 'canvas':
      return new CanvasRenderer();
    case 'webgpu':
      return new WebGPURenderer();
    default:
      throw new Error(`Unknown renderer type: ${type}`);
  }
}
```

Usage in Chart component:

```typescript
let renderer = createRenderer(renderTarget);

onMount(() => {
  renderer.initialize(width, height);
});
```

## Renderer Comparison

| Feature | SVG | Canvas | WebGPU |
|---------|-----|--------|--------|
| **SSR Support** | ✅ Yes | ❌ No | ❌ No |
| **Accessibility** | ✅ Native | ❌ Requires work | ❌ Requires work |
| **Performance (< 1K points)** | ✅ Good | ✅ Good | ⚠️ Overhead |
| **Performance (> 1K points)** | ❌ Slow | ✅ Fast | ✅✅ Very Fast |
| **Performance (> 10K points)** | ❌ Very Slow | ⚠️ OK | ✅✅ Excellent |
| **Browser Support** | ✅✅ Universal | ✅ IE9+ | ⚠️ Modern only |
| **Scalability** | ✅ Vector | ❌ Raster | ❌ Raster |
| **Inspectable** | ✅ Yes | ❌ Opaque | ❌ Opaque |
| **Animation** | ⚠️ CSS/SMIL | ✅ requestAnimationFrame | ✅ Compute shaders |
| **Export** | ✅ Native SVG | ⚠️ toDataURL | ⚠️ Complex |

## Choosing a Renderer

### Use SVG when:
- Server-side rendering is required
- Accessibility is important
- You need vector graphics (scaling, printing)
- Dataset is small (< 1000 points)
- You want to export to vector formats

### Use Canvas when:
- Performance is critical
- Dataset is large (> 1000 points)
- You need real-time updates
- Animation is important
- Accessibility is not required

### Use WebGPU when:
- Dataset is very large (> 10000 points)
- You need maximum performance
- You can target modern browsers
- You're comfortable with GPU programming
- Complex data transformations are needed

## Creating a Custom Renderer

To create a custom renderer:

### 1. Implement the Renderer Interface

```typescript
import type { Renderer, PancakePoint, PancakeCoordinates } from '../types';

export class MyCustomRenderer implements Renderer {
  readonly type = 'custom' as const;
  
  initialize(width: number, height: number): void {
    // Setup your renderer
  }
  
  clear(): void {
    // Clear the rendering surface
  }
  
  // Implement all required methods...
  
  getOutput(): unknown {
    // Return your rendered output
  }
}
```

### 2. Add to Factory

```typescript
export function createRenderer(type: RenderTarget | 'custom'): Renderer {
  switch (type) {
    // ... existing cases
    case 'custom':
      return new MyCustomRenderer();
  }
}
```

### 3. Use in Charts

```svelte
<Chart renderTarget="custom">
  <Line data={data} x="x" y="y" />
</Chart>
```

### Example: Console Renderer

A simple text-based renderer for debugging:

```typescript
export class ConsoleRenderer implements Renderer {
  readonly type = 'console' as const;
  private actions: string[] = [];
  
  initialize(width: number, height: number): void {
    this.actions = [`Initialize: ${width}x${height}`];
  }
  
  clear(): void {
    this.actions = [];
  }
  
  moveTo(point: PancakePoint): void {
    this.actions.push(`MoveTo: (${point.x}, ${point.y})`);
  }
  
  lineTo(point: PancakePoint): void {
    this.actions.push(`LineTo: (${point.x}, ${point.y})`);
  }
  
  stroke(color = '#000', width = 1): void {
    this.actions.push(`Stroke: ${color}, width ${width}`);
  }
  
  getOutput(): string {
    return this.actions.join('\n');
  }
}

// Usage
const renderer = new ConsoleRenderer();
renderer.initialize(600, 400);
renderer.moveTo({ x: 0, y: 50 });
renderer.lineTo({ x: 100, y: 50 });
renderer.stroke('#000', 2);

console.log(renderer.getOutput());
// Output:
// Initialize: 600x400
// MoveTo: (0, 50)
// LineTo: (100, 50)
// Stroke: #000, width 2
```

## Renderer Testing

### Unit Tests

Test each renderer independently:

```typescript
describe('SVGRenderer', () => {
  it('should generate correct SVG path', () => {
    const renderer = new SVGRenderer();
    renderer.initialize(600, 400);
    renderer.beginPath();
    renderer.moveTo({ x: 0, y: 0 });
    renderer.lineTo({ x: 100, y: 100 });
    renderer.stroke('#000', 2);
    
    const output = renderer.getOutput();
    expect(output).toContain('<path d="M 0 0 L 600 400"');
    expect(output).toContain('stroke="#000"');
    expect(output).toContain('stroke-width="2"');
  });
});
```

### Visual Tests

Compare renderer outputs:

```typescript
function testVisualEquivalence() {
  const svgRenderer = new SVGRenderer();
  const canvasRenderer = new CanvasRenderer();
  
  // Draw same chart with both
  drawTestChart(svgRenderer);
  drawTestChart(canvasRenderer);
  
  // Compare outputs (e.g., screenshot comparison)
  compareRenderers(svgRenderer, canvasRenderer);
}
```

### Performance Tests

Benchmark with various dataset sizes:

```typescript
function benchmarkRenderer(renderer: Renderer, pointCount: number) {
  const data = generateTestData(pointCount);
  
  const start = performance.now();
  renderer.initialize(600, 400);
  drawLineChart(renderer, data);
  const end = performance.now();
  
  console.log(`${renderer.type}: ${end - start}ms for ${pointCount} points`);
}

benchmarkRenderer(svgRenderer, 1000);
benchmarkRenderer(canvasRenderer, 1000);
benchmarkRenderer(webgpuRenderer, 1000);
```

## Best Practices

### 1. Initialize Before Use
```typescript
// ✅ Good
renderer.initialize(width, height);
renderer.beginPath();

// ❌ Bad
renderer.beginPath(); // May fail if not initialized
```

### 2. Clear Between Renders
```typescript
// ✅ Good
renderer.clear();
drawChart();

// ❌ Bad
drawChart(); // Draws on top of previous render
```

### 3. Handle Missing Context
```typescript
// ✅ Good
if (this.ctx) {
  this.ctx.stroke();
}

// ❌ Bad
this.ctx.stroke(); // May crash if ctx is null
```

### 4. Use Pancake Coordinates
```typescript
// ✅ Good: Pancake coordinates
renderer.moveTo({ x: 50, y: 50 });

// ❌ Bad: Pixel coordinates
renderer.moveTo({ x: 300, y: 200 });
```

## Future Enhancements

Planned improvements to the renderer system:

1. **WebGL Renderer**: For broader GPU support than WebGPU
2. **PDF Renderer**: Direct PDF export without rasterization
3. **String-based Canvas**: Canvas operations as replay strings
4. **Threaded Rendering**: Web Worker support for heavy calculations
5. **Hybrid Renderer**: SVG for static, Canvas for dynamic elements

## Conclusion

The renderer system is the foundation that enables:
- ✅ **Flexibility**: Switch renderers without changing components
- ✅ **Performance**: Choose optimal renderer for your use case
- ✅ **Extensibility**: Easy to add new renderers
- ✅ **Testability**: Mock renderers for component testing

Understanding renderers is key to:
- Building custom chart components
- Optimizing performance
- Adding new visualization types
- Contributing to the library
