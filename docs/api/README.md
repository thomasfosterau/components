# API Reference

Complete reference for all components, utilities, and types in @thomasfosterau/charts.

## Quick Reference

### Components

| Component | Description | Common Props |
|-----------|-------------|--------------|
| [Chart](./components.md#chart) | Root container | width, height, renderTarget, margin |
| [Line](./components.md#line) | Line chart | data, x, y, stroke, strokeWidth, fill |
| [Bar](./components.md#bar) | Bar chart | data, x, y, fill, stroke, barWidth |
| [Scatter](./components.md#scatter) | Scatter plot | data, x, y, radius, fill, stroke |
| [Area](./components.md#area) | Area chart | data, x, y, fill, stroke, strokeWidth |
| [Pie](./components.md#pie) | Pie/Donut chart | data, valueKey, labelKey, colors, innerRadius |
| [Axis](./components.md#axis) | Chart axis | scale, type, position, label, gridLines |
| [Grid](./components.md#grid) | Grid lines | xScale, yScale, showX, showY |
| [Legend](./components.md#legend) | Chart legend | items, position |

### Utilities

| Function | Description | Parameters |
|----------|-------------|------------|
| [createScale](./utilities.md#createscale) | Create D3 scale | type: ScaleType |
| [getNiceDomain](./utilities.md#getnicedomain) | Calculate nice domain | values: number[], padding: number |
| [getTicks](./utilities.md#getticks) | Generate tick values | domain: [number, number], count: number |
| [formatTick](./utilities.md#formattick) | Format tick labels | value: number \| Date, type: ScaleType |
| [pancakeToPixels](./utilities.md#pancaketopixels) | Convert pancake to pixels | value: number, size: number |
| [pixelsToPancake](./utilities.md#pixelstopancake) | Convert pixels to pancake | value: number, size: number |

### Renderers

| Renderer | Description | Use Case |
|----------|-------------|----------|
| [SVGRenderer](./renderers.md#svgrenderer) | SVG rendering | SSR, accessibility, small datasets |
| [CanvasRenderer](./renderers.md#canvasrenderer) | Canvas rendering | Large datasets, animations |
| [WebGPURenderer](./renderers.md#webgpurenderer) | WebGPU rendering | Massive datasets, GPU acceleration |

## Installation

```bash
bun add @thomasfosterau/charts
```

Or with npm:

```bash
npm install @thomasfosterau/charts
```

## Basic Import

```javascript
import {
  // Components
  Chart,
  Line,
  Bar,
  Scatter,
  Area,
  Pie,
  Axis,
  Grid,
  Legend,

  // Utilities
  createScale,
  getNiceDomain,
  getTicks,
  formatTick,

  // Themes
  defaultTheme,
  darkTheme,
  colorPalettes,
  getColorFromPalette,

  // Types
  type DataPoint,
  type Margin,
  type RenderTarget,
  type Scale
} from '@thomasfosterau/charts';
```

## TypeScript Support

The library is written in TypeScript and includes type definitions out of the box.

### Type Imports

```typescript
import type {
  DataPoint,
  Margin,
  RenderTarget,
  Renderer,
  TextOptions,
  ScaleType,
  Scale,
  AxisConfig,
  Theme,
  ChartContext,
  PancakePoint,
  PancakeCoordinates
} from '@thomasfosterau/charts';
```

## Common Types

### DataPoint

```typescript
interface DataPoint {
  [key: string]: unknown;
}
```

Any object can be a data point. Use keys to reference values in chart components.

### Margin

```typescript
interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

Defines spacing around the chart content area.

### RenderTarget

```typescript
type RenderTarget = 'svg' | 'canvas' | 'webgpu';
```

Available rendering backends.

### ScaleType

```typescript
type ScaleType = 
  | 'linear' 
  | 'log' 
  | 'time' 
  | 'band' 
  | 'ordinal' 
  | 'point' 
  | 'sqrt' 
  | 'pow';
```

D3 scale types supported by the library.

### PancakePoint

```typescript
interface PancakePoint {
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
}
```

Position in the Pancake coordinate system.

### PancakeCoordinates

```typescript
interface PancakeCoordinates {
  x1: number;  // 0-100 percentage
  y1: number;  // 0-100 percentage
  x2: number;  // 0-100 percentage
  y2: number;  // 0-100 percentage
}
```

Rectangle in the Pancake coordinate system.

## Quick Examples

### Line Chart

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 20 }
  ];

  const xScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.x), 0))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.y), 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke="#4299e1" />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

### Bar Chart

```svelte
<script>
  import { Chart, Bar, Axis } from '@thomasfosterau/charts';
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { category: 'A', value: 30 },
    { category: 'B', value: 50 }
  ];

  const xScale = createScale('band')
    .domain(data.map(d => d.category))
    .range([50, 550])
    .padding(0.2);

  const yScale = createScale('linear')
    .domain([0, Math.max(...data.map(d => d.value))])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Bar {data} x="category" y="value" fill="#48bb78" />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

### Scatter Plot

```svelte
<script>
  import { Chart, Scatter, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 10, y: 20 },
    { x: 15, y: 35 },
    { x: 25, y: 30 }
  ];

  const xScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.x), 0.1))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.y), 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Scatter {data} x="x" y="y" radius={5} fill="#ed8936" />
  <Axis scale={xScale} type="x" position="bottom" gridLines />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

## Error Handling

The library provides helpful error messages for common mistakes:

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  // ❌ Missing required props
  // Error: Line component requires 'data', 'x', and 'y' props
  
  // ✅ Correct usage
  const data = [{ x: 0, y: 10 }];
</script>

<Chart width={600} height={400}>
  <Line {data} x="x" y="y" />
</Chart>
```

## Detailed Documentation

For complete details on each component and utility, see:

- [Components Reference](./components.md) - All chart components
- [Utilities Reference](./utilities.md) - Helper functions and scales
- [Renderers Reference](./renderers.md) - Rendering backends

## Guides and Tutorials

- [Getting Started](../getting-started.md) - Installation and first chart
- [Basic Charts Tutorial](../tutorials/01-basic-charts.md) - All chart types
- [Advanced Features](../tutorials/02-advanced-features.md) - Scales, theming, etc.
- [Custom Components](../tutorials/03-custom-components.md) - Build your own
- [Render Targets Guide](../guides/render-targets.md) - SVG vs Canvas vs WebGPU
- [Scales Guide](../guides/scales-and-domains.md) - Understanding scales
- [Theming Guide](../guides/theming.md) - Customizing appearance
- [SSR Guide](../guides/ssr.md) - Server-side rendering

## Version History

For changelog and version history, see the [GitHub Releases](https://github.com/thomasfosterau/charts/releases).

## Support

- [GitHub Issues](https://github.com/thomasfosterau/charts/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/thomasfosterau/charts/discussions) - Questions and community
- [Examples](../../examples/README.md) - Working code examples
