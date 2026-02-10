# @thomasfosterau/charts

A declarative Svelte charting library with multiple render targets (SVG, Canvas, WebGPU) using the Pancake technique.

## Features

- 🎨 **Multiple Render Targets**: SVG (SSR-compatible), Canvas, and WebGPU support
- 🥞 **Pancake Coordinates**: Percentage-based coordinate system for renderer-agnostic layouts
- 📊 **Declarative API**: Inspired by Swift Charts and modern web frameworks
- ⚡ **High Performance**: Optimized rendering with Canvas and WebGPU options
- 🎯 **Type-Safe**: Built with TypeScript for excellent DX
- 🚀 **Powered by Bun**: Fast package management and runtime

## Installation

```bash
bun add @thomasfosterau/charts
```

## Quick Start

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 20 },
    { x: 3, y: 35 },
    { x: 4, y: 30 }
  ];

  const xScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.x), 0))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.y), 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
  <Axis scale={xScale} type="x" position="bottom" label="X Axis" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Y Axis" gridLines />
</Chart>
```

## Render Targets

### SVG (Default)
Perfect for SSR and static rendering:
```svelte
<Chart renderTarget="svg">
  <!-- Your charts -->
</Chart>
```

### Canvas
High-performance for dynamic visualizations:
```svelte
<Chart renderTarget="canvas">
  <!-- Your charts -->
</Chart>
```

### WebGPU
GPU-accelerated rendering for complex visualizations:
```svelte
<Chart renderTarget="webgpu">
  <!-- Your charts -->
</Chart>
```

## Chart Types

### Line Chart
```svelte
<Line data={myData} x="date" y="value" stroke="#4299e1" />
```

### Bar Chart
```svelte
<Bar data={myData} x="category" y="value" fill="#48bb78" />
```

### Scatter Plot
```svelte
<Scatter data={myData} x="x" y="y" radius={5} fill="#ed8936" />
```

## The Pancake Technique

This library uses the "Pancake" coordinate system, where all positions are specified as percentages (0-100) rather than pixels. This makes the rendering truly device-independent and allows the same chart description to work across SVG, Canvas, and WebGPU renderers.

## Documentation

📚 **Comprehensive documentation is available in the [docs](./docs) directory:**

### Getting Started
- [Getting Started Guide](./docs/getting-started.md) - Installation, setup, and your first chart

### Tutorials
- [Basic Charts](./docs/tutorials/01-basic-charts.md) - Learn all chart types
- [Advanced Features](./docs/tutorials/02-advanced-features.md) - Scales, theming, and more
- [Custom Components](./docs/tutorials/03-custom-components.md) - Build your own chart types

### Guides
- [Render Targets](./docs/guides/render-targets.md) - SVG vs Canvas vs WebGPU
- [Scales and Domains](./docs/guides/scales-and-domains.md) - Understanding D3 scales
- [Theming](./docs/guides/theming.md) - Colors, styles, and themes
- [SSR Support](./docs/guides/ssr.md) - Server-side rendering with SvelteKit

### API Reference
- [API Overview](./docs/api/README.md) - Quick reference
- [Components](./docs/api/components.md) - Complete component API
- [Utilities](./docs/api/utilities.md) - Helper functions and scales
- [Renderers](./docs/api/renderers.md) - Rendering backends

## Quick API Reference

### Components
- `Chart` - Root container component
- `Line` - Line chart visualization
- `Bar` - Bar chart visualization
- `Scatter` - Scatter plot visualization
- `Area` - Area chart visualization
- `Pie` - Pie/Donut chart
- `Axis` - Chart axis with ticks and labels
- `Grid` - Standalone grid lines
- `Legend` - Chart legend

### Utilities
- `createScale()` - Create D3-style scales
- `getNiceDomain()` - Calculate optimal domain ranges
- `getTicks()` - Generate tick values
- `formatTick()` - Format tick labels

### Renderers
- `SVGRenderer` - Server-side rendering compatible
- `CanvasRenderer` - High-performance Canvas API
- `WebGPURenderer` - GPU-accelerated rendering

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build the library
bun run build

# Run type checking
bun run check

# Format code
bun run format
```

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

To create a changeset:
```bash
bun run changeset
```

## License

MIT © Thomas Foster
