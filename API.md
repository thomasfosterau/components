# API Reference

## Components

### Chart

The root container component for all charts.

**Props:**
- `width` (number, default: 600) - Chart width in pixels
- `height` (number, default: 400) - Chart height in pixels
- `margin` (Margin, default: `{ top: 20, right: 20, bottom: 40, left: 50 }`) - Chart margins
- `renderTarget` (RenderTarget, default: 'svg') - Render target: 'svg', 'canvas', or 'webgpu'

**Usage:**
```svelte
<Chart width={800} height={600} renderTarget="svg">
  <!-- Chart components go here -->
</Chart>
```

---

### Line

Line chart component.

**Props:**
- `data` (DataPoint[]) - Array of data points (required)
- `x` (string) - Key for x values (required)
- `y` (string) - Key for y values (required)
- `stroke` (string, default: '#4299e1') - Line color
- `strokeWidth` (number, default: 2) - Line width
- `fill` (string | undefined) - Optional fill color for area under line

**Usage:**
```svelte
<Line data={myData} x="date" y="value" stroke="#4299e1" strokeWidth={2} />
```

---

### Bar

Bar chart component.

**Props:**
- `data` (DataPoint[]) - Array of data points (required)
- `x` (string) - Key for x values (required)
- `y` (string) - Key for y values (required)
- `fill` (string, default: '#4299e1') - Bar fill color
- `stroke` (string | undefined) - Optional bar border color
- `barWidth` (number, default: 0.8) - Bar width as fraction of available space (0-1)

**Usage:**
```svelte
<Bar data={myData} x="category" y="value" fill="#48bb78" />
```

---

### Scatter

Scatter plot component.

**Props:**
- `data` (DataPoint[]) - Array of data points (required)
- `x` (string) - Key for x values (required)
- `y` (string) - Key for y values (required)
- `fill` (string, default: '#4299e1') - Point fill color
- `stroke` (string | undefined) - Optional point border color
- `radius` (number, default: 4) - Point radius in pixels

**Usage:**
```svelte
<Scatter data={myData} x="x" y="y" radius={5} fill="#ed8936" />
```

---

### Area

Area chart component (filled line chart).

**Props:**
- `data` (DataPoint[]) - Array of data points (required)
- `x` (string) - Key for x values (required)
- `y` (string) - Key for y values (required)
- `fill` (string, default: 'rgba(66, 153, 225, 0.3)') - Area fill color
- `stroke` (string, default: '#4299e1') - Line color
- `strokeWidth` (number, default: 2) - Line width

**Usage:**
```svelte
<Area data={myData} x="date" y="value" fill="rgba(66, 153, 225, 0.3)" />
```

---

### Pie

Pie chart component (also supports donut charts).

**Props:**
- `data` (DataPoint[]) - Array of data points (required)
- `valueKey` (string, default: 'value') - Key for values
- `labelKey` (string, default: 'label') - Key for labels
- `colors` (string[], default: predefined palette) - Array of colors for slices
- `innerRadius` (number, default: 0) - Inner radius (set > 0 for donut chart)
- `showLabels` (boolean, default: true) - Whether to show labels

**Usage:**
```svelte
<Pie data={myData} valueKey="value" labelKey="label" />

<!-- Donut chart -->
<Pie data={myData} innerRadius={50} />
```

---

### Axis

Axis component with ticks, labels, and optional grid lines.

**Props:**
- `scale` (any) - D3 scale instance (required)
- `scaleType` (ScaleType, default: 'linear') - Type of scale
- `type` ('x' | 'y', default: 'x') - Axis orientation
- `position` ('top' | 'bottom' | 'left' | 'right') - Axis position
- `label` (string, default: '') - Axis label
- `tickCount` (number, default: 10) - Number of ticks
- `tickFormat` (function | undefined) - Custom tick formatter
- `gridLines` (boolean, default: false) - Show grid lines

**Usage:**
```svelte
<Axis scale={xScale} type="x" position="bottom" label="X Axis" gridLines />
```

---

## Utilities

### createScale(type)

Creates a D3 scale of the specified type.

**Parameters:**
- `type` (ScaleType) - Scale type: 'linear', 'log', 'time', 'band', 'ordinal', 'point', 'sqrt', 'pow'

**Returns:** D3 scale instance

**Usage:**
```javascript
import { createScale } from '@thomasfosterau/charts';

const xScale = createScale('linear')
  .domain([0, 100])
  .range([0, 600]);
```

---

### getNiceDomain(values, padding)

Calculates an optimal domain range for data with padding.

**Parameters:**
- `values` (number[]) - Array of numeric values
- `padding` (number, default: 0.1) - Padding as fraction of range (0-1)

**Returns:** `[min, max]` tuple

**Usage:**
```javascript
import { getNiceDomain } from '@thomasfosterau/charts';

const domain = getNiceDomain([10, 25, 30, 45], 0.1);
// Returns approximately [7, 48] (with 10% padding)
```

---

### getTicks(domain, count)

Generates evenly-spaced tick values for a domain.

**Parameters:**
- `domain` ([number, number]) - Domain range
- `count` (number, default: 10) - Desired number of ticks

**Returns:** Array of tick values

---

### formatTick(value, type)

Formats a tick value for display.

**Parameters:**
- `value` (number | Date) - Value to format
- `type` (ScaleType, default: 'linear') - Scale type

**Returns:** Formatted string

**Usage:**
```javascript
formatTick(1500, 'linear') // "1.5K"
formatTick(1000000, 'linear') // "1.0M"
```

---

## Types

### DataPoint

```typescript
interface DataPoint {
  [key: string]: unknown;
}
```

Generic data point interface. Your data objects can have any properties.

---

### Margin

```typescript
interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

Chart margin configuration.

---

### RenderTarget

```typescript
type RenderTarget = 'svg' | 'canvas' | 'webgpu';
```

Available rendering backends.

---

### ScaleType

```typescript
type ScaleType = 'linear' | 'log' | 'time' | 'band' | 'ordinal' | 'point' | 'sqrt' | 'pow';
```

Available scale types (from D3).

---

## Renderer Interface

Advanced usage: You can access the renderer directly through the chart context.

```typescript
interface Renderer {
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

**PancakePoint:** `{ x: number, y: number }` where x and y are in 0-100 range

**PancakeCoordinates:** `{ x1: number, y1: number, x2: number, y2: number }` where all values are in 0-100 range

---

## Creating Custom Components

You can create custom chart components by accessing the chart context:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';

  const { renderer, width, height, margin } = getChartContext();

  onMount(() => {
    // Use renderer methods to draw
    renderer.beginPath();
    renderer.moveTo({ x: 10, y: 10 }); // 10% from left, 10% from top
    renderer.lineTo({ x: 90, y: 90 }); // 90% from left, 90% from top
    renderer.stroke('#000', 2);
  });
</script>
```

The Pancake coordinate system means:
- `x: 0` = left edge, `x: 100` = right edge
- `y: 0` = top edge, `y: 100` = bottom edge

This coordinate system is renderer-agnostic and works the same across SVG, Canvas, and WebGPU.
