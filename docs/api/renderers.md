# Renderers API Reference

Complete reference for the rendering backends in @thomasfosterau/charts.

## Overview

@thomasfosterau/charts supports three rendering backends, all implementing the same `Renderer` interface. This allows charts to work identically across different render targets.

## Renderer Interface

All renderers implement this common interface:

```typescript
interface Renderer {
  // Initialization
  initialize(width: number, height: number): void;
  
  // Clearing
  clear(): void;
  
  // Path operations
  beginPath(): void;
  moveTo(point: PancakePoint): void;
  lineTo(point: PancakePoint): void;
  closePath(): void;
  
  // Styling
  stroke(color?: string, width?: number): void;
  fill(color?: string): void;
  setOpacity(alpha: number): void;
  
  // Shapes
  circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void;
  rect(coords: PancakeCoordinates, fill?: string, stroke?: string): void;
  
  // Text
  text(point: PancakePoint, text: string, options?: TextOptions): void;
  
  // Output
  getOutput(): unknown;
}
```

### PancakePoint

```typescript
interface PancakePoint {
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
}
```

### PancakeCoordinates

```typescript
interface PancakeCoordinates {
  x1: number;  // 0-100 percentage
  y1: number;  // 0-100 percentage
  x2: number;  // 0-100 percentage
  y2: number;  // 0-100 percentage
}
```

### TextOptions

```typescript
interface TextOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fill?: string;
  stroke?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  rotation?: number;
}
```

## SVGRenderer

Renders charts as SVG (Scalable Vector Graphics).

### When to Use

✅ **Best for:**
- Server-side rendering (SSR)
- Static site generation
- Small to medium datasets (<1000 points)
- Accessibility requirements
- Print and export to vector formats
- SEO-friendly content

❌ **Avoid for:**
- Large datasets (>1000 points)
- Real-time animations
- Performance-critical visualizations

### Usage

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
</script>

<!-- SVG is the default -->
<Chart width={600} height={400}>
  <Line {data} x="x" y="y" />
</Chart>

<!-- Or explicitly specify -->
<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

### Features

- ✅ Server-side rendering compatible
- ✅ Crisp at any zoom level
- ✅ Accessible DOM structure
- ✅ CSS styling support
- ✅ Inspectable in DevTools
- ✅ No JavaScript required for display

### Output Format

```html
<svg width="600" height="400">
  <path d="M50,360 L150,340 L250,350..." stroke="#4299e1" fill="none"/>
  <g class="axis">
    <line x1="50" y1="40" x2="50" y2="360"/>
    <!-- ... axis ticks and labels -->
  </g>
</svg>
```

### Direct Usage (Advanced)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { SVGRenderer } from '@thomasfosterau/charts';
  
  let container;
  let renderer;
  let svgContent = '';

  onMount(() => {
    renderer = new SVGRenderer();
    renderer.initialize(600, 400);
    
    // Draw shapes
    renderer.beginPath();
    renderer.moveTo({ x: 10, y: 10 });
    renderer.lineTo({ x: 90, y: 90 });
    renderer.stroke('#000', 2);
    
    renderer.circle({ x: 50, y: 50 }, 5, '#4299e1');
    
    // Get SVG output
    svgContent = renderer.getOutput() as string;
  });
</script>

<div bind:this={container}>
  {@html svgContent}
</div>
```

## CanvasRenderer

Renders charts using the HTML5 Canvas API.

### When to Use

✅ **Best for:**
- Large datasets (1,000-100,000 points)
- Real-time data updates
- Smooth animations
- Client-side only applications
- Performance-critical visualizations

❌ **Avoid for:**
- Server-side rendering
- Accessibility requirements
- When element inspection is needed
- Vector export requirements

### Usage

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  
  const largeDataset = [/* thousands of points */];
</script>

<Chart width={800} height={600} renderTarget="canvas">
  <Line data={largeDataset} x="x" y="y" stroke="#4299e1" />
</Chart>
```

### Features

- ✅ High performance with large datasets
- ✅ Smooth animations
- ✅ Low memory footprint
- ✅ Direct pixel manipulation
- ❌ Requires browser Canvas API
- ❌ Bitmap (can look blurry when scaled)
- ❌ Not accessible
- ❌ Can't inspect individual elements

### Performance

Canvas rendering is significantly faster for large datasets:

| Data Points | SVG | Canvas | Speedup |
|-------------|-----|--------|---------|
| 100 | 10ms | 5ms | 2x |
| 1,000 | 100ms | 15ms | 6.7x |
| 10,000 | 1000ms | 50ms | 20x |
| 100,000 | ~10s | 200ms | 50x |

### Output Format

```html
<canvas width="800" height="600"></canvas>
```

The rendering happens via JavaScript using the Canvas 2D API.

### Direct Usage (Advanced)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { CanvasRenderer } from '@thomasfosterau/charts';
  
  let canvas;
  let renderer;

  onMount(() => {
    renderer = new CanvasRenderer(canvas);
    renderer.initialize(600, 400);
    
    // Clear and draw
    renderer.clear();
    renderer.beginPath();
    renderer.moveTo({ x: 10, y: 10 });
    renderer.lineTo({ x: 90, y: 90 });
    renderer.stroke('#000', 2);
    
    renderer.circle({ x: 50, y: 50 }, 5, '#4299e1');
  });
</script>

<canvas bind:this={canvas}></canvas>
```

## WebGPURenderer

Renders charts using the WebGPU API for GPU acceleration (experimental).

### When to Use

✅ **Best for:**
- Extremely large datasets (>100,000 points)
- Complex visualizations requiring GPU compute
- Advanced shader effects
- Real-time 3D visualizations

❌ **Avoid for:**
- Simple charts
- When browser support is a concern
- Server-side rendering
- Production without fallback (experimental API)

### Browser Support

As of 2024:
- ✅ Chrome/Edge 113+
- ✅ Safari 18+ (macOS 14+)
- ❌ Firefox (in development)
- ❌ Most mobile browsers

Check support:
```javascript
const hasWebGPU = 'gpu' in navigator;
```

### Usage

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  
  const massiveDataset = [/* hundreds of thousands of points */];
</script>

<Chart width={1200} height={800} renderTarget="webgpu">
  <Line data={massiveDataset} x="x" y="y" stroke="#4299e1" />
</Chart>
```

### Features

- ✅ GPU-accelerated rendering
- ✅ Handles millions of data points
- ✅ Advanced compute capabilities
- ✅ Custom shaders support
- ❌ Limited browser support
- ❌ Experimental API
- ❌ Requires WebGPU-capable device
- ❌ No SSR support

### With Fallback

```svelte
<script>
  import { onMount } from 'svelte';
  
  let renderTarget = 'webgpu';
  
  onMount(() => {
    if (!('gpu' in navigator)) {
      console.log('WebGPU not supported, falling back to Canvas');
      renderTarget = 'canvas';
    }
  });
</script>

<Chart width={800} height={600} {renderTarget}>
  <Line {data} x="x" y="y" />
</Chart>
```

### Output Format

```html
<canvas width="1200" height="800"></canvas>
```

Rendering happens via WebGPU API with GPU shaders.

### Direct Usage (Advanced)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { WebGPURenderer } from '@thomasfosterau/charts';
  
  let canvas;
  let renderer;

  onMount(async () => {
    if (!('gpu' in navigator)) {
      console.error('WebGPU not supported');
      return;
    }
    
    renderer = new WebGPURenderer(canvas);
    await renderer.initialize(1200, 800);
    
    // Draw with GPU acceleration
    renderer.beginPath();
    renderer.moveTo({ x: 10, y: 10 });
    renderer.lineTo({ x: 90, y: 90 });
    renderer.stroke('#000', 2);
  });
</script>

<canvas bind:this={canvas}></canvas>
```

## Renderer Methods

### Initialization

#### initialize(width, height)

Initialize the renderer with dimensions.

```javascript
renderer.initialize(600, 400);
```

### Clearing

#### clear()

Clear the rendering surface.

```javascript
renderer.clear();
```

### Path Operations

#### beginPath()

Start a new path.

```javascript
renderer.beginPath();
```

#### moveTo(point)

Move to a point without drawing.

```javascript
renderer.moveTo({ x: 10, y: 10 });
```

#### lineTo(point)

Draw a line to a point.

```javascript
renderer.lineTo({ x: 90, y: 90 });
```

#### closePath()

Close the current path.

```javascript
renderer.closePath();
```

### Styling

#### stroke(color, width)

Stroke the current path.

```javascript
renderer.stroke('#4299e1', 2);
```

#### fill(color)

Fill the current path.

```javascript
renderer.fill('#48bb78');
```

#### setOpacity(alpha)

Set global opacity.

```javascript
renderer.setOpacity(0.5); // 50% transparent
// Draw something
renderer.setOpacity(1.0); // Reset
```

### Shapes

#### circle(point, radius, fill, stroke)

Draw a circle.

```javascript
renderer.circle(
  { x: 50, y: 50 },  // center
  5,                  // radius
  '#4299e1',         // fill
  '#2c5282'          // stroke (optional)
);
```

#### rect(coords, fill, stroke)

Draw a rectangle.

```javascript
renderer.rect(
  { x1: 10, y1: 10, x2: 90, y2: 90 },  // coordinates
  '#48bb78',                            // fill
  '#2f855a'                             // stroke (optional)
);
```

### Text

#### text(point, text, options)

Draw text at a position.

```javascript
renderer.text(
  { x: 50, y: 50 },
  'Hello, World!',
  {
    fontSize: 14,
    fontFamily: 'sans-serif',
    fill: '#000',
    textAnchor: 'middle',
    baseline: 'middle'
  }
);
```

### Output

#### getOutput()

Get the renderer's output (renderer-specific).

```javascript
const output = renderer.getOutput();
// SVGRenderer: Returns SVG element
// CanvasRenderer: Returns canvas element
// WebGPURenderer: Returns canvas element
```

## Example: Custom Renderer Usage

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import type { PancakePoint } from '@thomasfosterau/charts';

  export let data: Array<{ x: number; y: number }>;
  export let radius = 5;
  export let fill = '#4299e1';

  const { renderer } = getChartContext();

  onMount(() => {
    // Draw custom visualization
    data.forEach((d, i) => {
      const point: PancakePoint = {
        x: (d.x / 100) * 100,  // Convert to pancake
        y: (d.y / 100) * 100
      };
      
      // Vary opacity based on index
      const opacity = 0.3 + (i / data.length) * 0.7;
      renderer.setOpacity(opacity);
      renderer.circle(point, radius, fill);
    });
    
    renderer.setOpacity(1.0); // Reset
  });
</script>
```

## Choosing the Right Renderer

### Decision Matrix

| Requirement | Renderer | Reason |
|------------|----------|--------|
| SSR | SVG | Only option that works server-side |
| <1K points | SVG | Clean markup, accessible |
| 1K-10K points | Canvas | Better performance |
| >10K points | Canvas or WebGPU | GPU acceleration |
| Accessibility | SVG | Semantic markup |
| Print/Export | SVG | Vector format |
| Animations | Canvas/WebGPU | Better performance |
| Mobile | SVG or Canvas | WebGPU limited support |

### Progressive Enhancement

Start with SVG, upgrade to Canvas on client:

```svelte
<script>
  import { browser } from '$app/environment';
  
  let renderTarget = 'svg';
  
  $: if (browser && data.length > 1000) {
    renderTarget = 'canvas';
  }
</script>

<Chart {renderTarget}>
  <Line {data} x="x" y="y" />
</Chart>
```

## Best Practices

1. **Default to SVG** for SSR compatibility
2. **Switch to Canvas** for large datasets (>1000 points)
3. **Use WebGPU** only with fallback and when truly needed
4. **Test across targets** to ensure consistency
5. **Consider accessibility** when choosing renderers

## Further Reading

- [Render Targets Guide](../guides/render-targets.md) - Detailed comparison
- [Custom Components Tutorial](../tutorials/03-custom-components.md) - Using renderers
- [Components Reference](./components.md) - Chart components
- [API Overview](./README.md) - Quick reference
