# Getting Started

This guide will help you install @thomasfosterau/charts and create your first chart in just a few minutes.

## Installation

### Using Bun (Recommended)

```bash
bun add @thomasfosterau/charts
```

### Using npm

```bash
npm install @thomasfosterau/charts
```

### Using pnpm

```bash
pnpm add @thomasfosterau/charts
```

## Prerequisites

- Svelte 4 or 5
- Node.js 18+ (or Bun)
- A Svelte project (SvelteKit or standalone)

## Your First Chart

Let's create a simple line chart to get started. Create a new Svelte component:

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  // Sample data
  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 20 },
    { x: 3, y: 35 },
    { x: 4, y: 30 }
  ];

  // Extract values for scaling
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

  // Create scales
  const xScale = createScale('linear')
    .domain(getNiceDomain(xValues, 0))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(yValues, 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
  <Axis scale={xScale} type="x" position="bottom" label="X Axis" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Y Axis" gridLines />
</Chart>
```

That's it! You now have a fully functional line chart with axes and grid lines.

## Understanding the Code

Let's break down what each part does:

### 1. Imports

```javascript
import { Chart, Line, Axis } from '@thomasfosterau/charts';
import { createScale, getNiceDomain } from '@thomasfosterau/charts';
```

We import:
- **Chart**: The root container component
- **Line**: The line chart component
- **Axis**: Component for rendering axes
- **createScale**: Function to create D3 scales
- **getNiceDomain**: Utility to calculate optimal data ranges

### 2. Data

```javascript
const data = [
  { x: 0, y: 10 },
  { x: 1, y: 25 },
  // ...
];
```

Your data should be an array of objects. Each object represents a data point with keys that you'll reference in the chart components.

### 3. Scales

```javascript
const xScale = createScale('linear')
  .domain(getNiceDomain(xValues, 0))
  .range([50, 550]);
```

Scales map your data values to visual positions:
- **domain**: The range of your data values
- **range**: The pixel coordinates on the chart
- **getNiceDomain**: Adds padding and rounds to nice numbers

### 4. Chart Component

```svelte
<Chart width={600} height={400} renderTarget="svg">
  <!-- Chart content -->
</Chart>
```

The Chart component sets up the rendering context:
- **width/height**: Chart dimensions in pixels
- **renderTarget**: Choose 'svg', 'canvas', or 'webgpu'

### 5. Data Visualization Components

```svelte
<Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
```

Components like Line, Bar, and Scatter render your data:
- **data**: Your data array
- **x/y**: Keys to access x and y values from each data point
- **stroke/fill**: Colors for the visualization
- **strokeWidth**: Line thickness

## Next Steps

Now that you have your first chart working, you can:

1. **Explore different chart types** - Try Bar, Scatter, Area, or Pie charts
2. **Customize the appearance** - Change colors, sizes, and styles
3. **Add more features** - Legends, tooltips, and interactions (coming soon)
4. **Try different render targets** - Experiment with Canvas or WebGPU for better performance

Continue to the [Basic Charts Tutorial](./tutorials/01-basic-charts.md) to learn about all available chart types.

## Common Issues

### "Module not found" errors

Make sure you've installed the package:
```bash
bun add @thomasfosterau/charts
```

### Chart not rendering

1. Check that your Chart component has valid width and height props
2. Ensure your data array is not empty
3. Verify your scale domains and ranges are correct

### TypeScript errors

If using TypeScript, ensure you have the proper type definitions. The library includes TypeScript types out of the box.

## Using with SvelteKit

The library works seamlessly with SvelteKit. Since it supports SSR, you can use it in both server and client-side rendering:

```svelte
<!-- +page.svelte -->
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  // ... your code
</script>

<Chart renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

For SSR, always use `renderTarget="svg"` as Canvas and WebGPU require browser APIs.

See the [SSR Support Guide](./guides/ssr.md) for more details.

## What's Next?

- [Tutorial: Basic Charts](./tutorials/01-basic-charts.md) - Learn all chart types
- [Guide: Render Targets](./guides/render-targets.md) - Understand SVG vs Canvas vs WebGPU
- [API Reference](./api/README.md) - Complete API documentation
