# Extending the Library

This guide explains how to extend `@thomasfosterau/charts` with custom components, renderers, scales, and other features.

## Table of Contents

1. [Creating Custom Chart Components](#creating-custom-chart-components)
2. [Creating Custom Renderers](#creating-custom-renderers)
3. [Creating Custom Scales](#creating-custom-scales)
4. [Creating Custom Themes](#creating-custom-themes)
5. [Adding Data Transformers](#adding-data-transformers)
6. [Contributing Back](#contributing-back)

## Creating Custom Chart Components

### Basic Custom Component

Here's how to create a custom chart component that uses the library's infrastructure:

```svelte
<!-- CustomMark.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import type { DataPoint } from '@thomasfosterau/charts';
  
  export let data: DataPoint[];
  export let x: string;
  export let y: string;
  export let fill = '#4299e1';
  
  // Get chart context
  const { renderer, width, height, margin } = getChartContext();
  
  // Create scales (or accept as props)
  $: xScale = createScale('linear')
    .domain(extent(data, d => d[x]))
    .range([margin.left, width - margin.right]);
  
  $: yScale = createScale('linear')
    .domain(extent(data, d => d[y]))
    .range([height - margin.bottom, margin.top]);
  
  // Transform data to Pancake coordinates
  $: points = data.map(d => ({
    x: (xScale(d[x]) / width) * 100,
    y: (yScale(d[y]) / height) * 100
  }));
  
  // Draw when data changes
  $: if (renderer && points.length) {
    drawCustomMark();
  }
  
  function drawCustomMark() {
    // Your custom rendering logic
    points.forEach(point => {
      renderer.circle(point, 5, fill);
    });
  }
</script>
```

Usage:

```svelte
<Chart width={600} height={400}>
  <CustomMark data={myData} x="date" y="value" />
</Chart>
```

### Advanced: Custom Bar Chart with Gradients

```svelte
<!-- GradientBar.svelte -->
<script lang="ts">
  import { getChartContext, createScale } from '@thomasfosterau/charts';
  import { extent } from 'd3-array';
  
  export let data;
  export let x;
  export let y;
  export let colorStart = '#667eea';
  export let colorEnd = '#764ba2';
  
  const { renderer, width, height, margin } = getChartContext();
  
  $: xScale = createScale('band')
    .domain(data.map(d => d[x]))
    .range([margin.left, width - margin.right])
    .padding(0.1);
  
  $: yScale = createScale('linear')
    .domain([0, max(data, d => d[y])])
    .range([height - margin.bottom, margin.top]);
  
  $: if (renderer && data) {
    drawGradientBars();
  }
  
  function drawGradientBars() {
    data.forEach((d, i) => {
      const x1 = (xScale(d[x]) / width) * 100;
      const y1 = (yScale(d[y]) / height) * 100;
      const x2 = ((xScale(d[x]) + xScale.bandwidth()) / width) * 100;
      const y2 = ((height - margin.bottom) / height) * 100;
      
      // Interpolate color based on value
      const t = d[y] / max(data, d => d[y]);
      const color = interpolateColor(colorStart, colorEnd, t);
      
      renderer.rect({ x1, y1, x2, y2 }, color);
    });
  }
  
  function interpolateColor(color1, color2, t) {
    // Simple color interpolation
    // In production, use d3-interpolate
    return color2; // Simplified
  }
</script>
```

### Custom Component Checklist

✅ **Do:**
- Use `getChartContext()` to access renderer
- Transform data to Pancake coordinates (0-100)
- Use reactive statements (`$:`) for automatic updates
- Accept scales as props for flexibility
- Handle edge cases (empty data, etc.)

❌ **Don't:**
- Access DOM directly (let renderer handle it)
- Use pixel coordinates (use Pancake)
- Mutate external state
- Render outside the chart bounds

## Creating Custom Renderers

### Implementing the Renderer Interface

To create a custom renderer, implement the `Renderer` interface:

```typescript
// CustomRenderer.ts
import type { 
  Renderer, 
  PancakePoint, 
  PancakeCoordinates,
  TextOptions,
  RenderTarget 
} from '@thomasfosterau/charts';

export class CustomRenderer implements Renderer {
  readonly type: RenderTarget = 'custom' as RenderTarget;
  
  private width: number = 0;
  private height: number = 0;
  private output: any[] = [];
  
  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.output = [];
  }
  
  clear(): void {
    this.output = [];
  }
  
  beginPath(): void {
    // Start a new path
  }
  
  moveTo(point: PancakePoint): void {
    const [x, y] = this.toPx(point);
    // Move to position
  }
  
  lineTo(point: PancakePoint): void {
    const [x, y] = this.toPx(point);
    // Draw line to position
  }
  
  closePath(): void {
    // Close the current path
  }
  
  stroke(color = '#000', width = 1): void {
    // Stroke the current path
  }
  
  fill(color = '#000'): void {
    // Fill the current path
  }
  
  circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void {
    const [x, y] = this.toPx(point);
    // Draw circle
  }
  
  rect(coords: PancakeCoordinates, fill?: string, stroke?: string): void {
    const [x1, y1] = this.toPx({ x: coords.x1, y: coords.y1 });
    const [x2, y2] = this.toPx({ x: coords.x2, y: coords.y2 });
    // Draw rectangle
  }
  
  text(point: PancakePoint, text: string, options?: TextOptions): void {
    const [x, y] = this.toPx(point);
    // Draw text
  }
  
  setOpacity(alpha: number): void {
    // Set global opacity
  }
  
  getOutput(): unknown {
    return this.output;
  }
  
  // Helper method to convert Pancake to pixels
  private toPx(point: PancakePoint): [number, number] {
    return [
      (point.x / 100) * this.width,
      (point.y / 100) * this.height
    ];
  }
}
```

### Example: ASCII Art Renderer

A fun example that renders charts as ASCII art:

```typescript
// ASCIIRenderer.ts
export class ASCIIRenderer implements Renderer {
  readonly type = 'ascii' as const;
  
  private width: number = 80;
  private height: number = 24;
  private grid: string[][] = [];
  
  initialize(width: number, height: number): void {
    // ASCII dimensions in characters
    this.width = 80;
    this.height = 24;
    
    // Initialize grid with spaces
    this.grid = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(' '));
  }
  
  clear(): void {
    this.grid = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(' '));
  }
  
  lineTo(point: PancakePoint): void {
    const [x, y] = this.toChars(point);
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x] = '*';
    }
  }
  
  circle(point: PancakePoint, radius: number, fill?: string): void {
    const [cx, cy] = this.toChars(point);
    const r = Math.round(radius / 10); // Scale radius
    
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = 'o';
          }
        }
      }
    }
  }
  
  text(point: PancakePoint, text: string): void {
    const [x, y] = this.toChars(point);
    for (let i = 0; i < text.length && x + i < this.width; i++) {
      if (x + i >= 0 && y >= 0 && y < this.height) {
        this.grid[y][x + i] = text[i];
      }
    }
  }
  
  getOutput(): string {
    return this.grid.map(row => row.join('')).join('\n');
  }
  
  private toChars(point: PancakePoint): [number, number] {
    return [
      Math.round((point.x / 100) * this.width),
      Math.round((point.y / 100) * this.height)
    ];
  }
  
  // Implement other required methods...
  beginPath(): void {}
  moveTo(): void {}
  closePath(): void {}
  stroke(): void {}
  fill(): void {}
  rect(): void {}
  setOpacity(): void {}
}
```

Usage:

```typescript
import { createRenderer } from '@thomasfosterau/charts';
import { ASCIIRenderer } from './ASCIIRenderer';

// Register custom renderer
function createRenderer(type) {
  if (type === 'ascii') return new ASCIIRenderer();
  // ... existing renderers
}

// Use in chart
<Chart renderTarget="ascii">
  <Line data={data} x="x" y="y" />
</Chart>

// Output:
//                                    *
//                               *
//                          *
//                     *
//                *
//           *
//      *
// *
```

## Creating Custom Scales

### Wrapping D3 Scales

Create a custom scale that wraps D3:

```typescript
// customScales.ts
import { scaleLinear, scaleLog } from 'd3-scale';

export function createLogisticScale() {
  const linear = scaleLinear();
  
  return {
    domain: (d) => {
      linear.domain(d);
      return scale;
    },
    range: (r) => {
      linear.range(r);
      return scale;
    },
    scale: (x) => {
      // Logistic function: 1 / (1 + e^-x)
      const logistic = 1 / (1 + Math.exp(-x));
      return linear(logistic);
    }
  };
}
```

### Custom Scale from Scratch

```typescript
// percentileScale.ts
export function createPercentileScale() {
  let _domain = [0, 100];
  let _range = [0, 100];
  let _data: number[] = [];
  
  function scale(value: number): number {
    // Find percentile of value in data
    const sorted = [..._data].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    const percentile = (index / sorted.length) * 100;
    
    // Map percentile to range
    const [d0, d1] = _domain;
    const [r0, r1] = _range;
    return r0 + ((percentile - d0) / (d1 - d0)) * (r1 - r0);
  }
  
  scale.domain = (d: [number, number]) => {
    _domain = d;
    return scale;
  };
  
  scale.range = (r: [number, number]) => {
    _range = r;
    return scale;
  };
  
  scale.data = (d: number[]) => {
    _data = d;
    return scale;
  };
  
  return scale;
}
```

Usage:

```svelte
<script>
  import { createPercentileScale } from './customScales';
  
  const scale = createPercentileScale()
    .domain([0, 100])
    .range([0, 600])
    .data(myData.map(d => d.value));
</script>
```

## Creating Custom Themes

### Basic Theme

```typescript
// customTheme.ts
import type { Theme } from '@thomasfosterau/charts';

export const neonTheme: Theme = {
  background: '#000000',
  foreground: '#00ff00',
  
  colors: {
    primary: '#00ff00',
    secondary: '#ff00ff',
    tertiary: '#00ffff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
  },
  
  chart: {
    background: '#000000',
    gridColor: '#00ff00',
    gridOpacity: 0.2,
    axisColor: '#00ff00',
    textColor: '#00ff00',
  },
  
  font: {
    family: 'Courier New, monospace',
    size: {
      small: 10,
      medium: 12,
      large: 14,
    },
  },
};
```

Usage:

```svelte
<script>
  import { setThemeContext } from '@thomasfosterau/charts';
  import { neonTheme } from './customTheme';
  
  setThemeContext(neonTheme);
</script>

<Chart>
  <Line data={data} /> <!-- Uses neon theme -->
</Chart>
```

### Dynamic Themes

```typescript
// themeGenerator.ts
export function generateTheme(primaryColor: string): Theme {
  return {
    background: '#ffffff',
    foreground: primaryColor,
    
    colors: {
      primary: primaryColor,
      // Generate other colors based on primary
      secondary: shiftHue(primaryColor, 120),
      tertiary: shiftHue(primaryColor, 240),
      // ...
    },
    
    // ... rest of theme
  };
}

function shiftHue(color: string, degrees: number): string {
  // Convert to HSL, shift hue, convert back
  // Implementation details...
  return color;
}
```

## Adding Data Transformers

### Basic Transformer

```typescript
// dataTransformers.ts
export function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, i + Math.ceil(window / 2));
    const values = data.slice(start, end);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    result.push(avg);
  }
  
  return result;
}

export function outlierRemoval(
  data: DataPoint[], 
  key: string, 
  threshold = 3
): DataPoint[] {
  const values = data.map(d => d[key]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
  );
  
  return data.filter(d => {
    const z = Math.abs((d[key] - mean) / stdDev);
    return z < threshold;
  });
}
```

Usage:

```svelte
<script>
  import { movingAverage, outlierRemoval } from './dataTransformers';
  
  let rawData = [...];
  
  $: cleanData = outlierRemoval(rawData, 'value');
  $: smoothData = cleanData.map((d, i, arr) => ({
    ...d,
    smoothValue: movingAverage(arr.map(x => x.value), 5)[i]
  }));
</script>

<Chart>
  <Line data={smoothData} x="date" y="smoothValue" />
</Chart>
```

### Advanced: Time Series Aggregation

```typescript
// timeSeriesTransformers.ts
import { timeDay, timeHour, timeWeek } from 'd3-time';
import { rollup } from 'd3-array';

export function aggregateTimeSeries(
  data: DataPoint[],
  dateKey: string,
  valueKey: string,
  interval: 'hour' | 'day' | 'week',
  aggregation: 'sum' | 'avg' | 'min' | 'max'
): DataPoint[] {
  const intervalFn = {
    hour: timeHour,
    day: timeDay,
    week: timeWeek,
  }[interval];
  
  const aggFn = {
    sum: (values) => values.reduce((a, b) => a + b, 0),
    avg: (values) => values.reduce((a, b) => a + b, 0) / values.length,
    min: (values) => Math.min(...values),
    max: (values) => Math.max(...values),
  }[aggregation];
  
  const grouped = rollup(
    data,
    (group) => aggFn(group.map(d => d[valueKey])),
    (d) => intervalFn.floor(new Date(d[dateKey]))
  );
  
  return Array.from(grouped, ([date, value]) => ({
    [dateKey]: date,
    [valueKey]: value,
  }));
}
```

## Plugin System (Future)

### Planned Plugin Architecture

```typescript
// plugin.ts (Future API)
interface Plugin {
  name: string;
  install(charts: ChartsLibrary): void;
}

export const myPlugin: Plugin = {
  name: 'my-plugin',
  
  install(charts) {
    // Add custom component
    charts.components.register('MyChart', MyChartComponent);
    
    // Add custom renderer
    charts.renderers.register('webgl', WebGLRenderer);
    
    // Add custom scale
    charts.scales.register('custom', createCustomScale);
    
    // Add utility functions
    charts.utils.register('transform', myTransform);
  },
};

// Usage
import { Charts } from '@thomasfosterau/charts';
import { myPlugin } from './myPlugin';

Charts.use(myPlugin);
```

## Contributing Back

### When to Contribute

Consider contributing your extension if:
- ✅ It solves a common use case
- ✅ It's well-tested
- ✅ It follows library conventions
- ✅ Documentation is included

### Contribution Process

1. **Fork the Repository**
   ```bash
   git clone https://github.com/thomasfosterau/charts
   cd charts
   git checkout -b feature/my-extension
   ```

2. **Add Your Extension**
   - Place files in appropriate directory
   - Follow existing code style
   - Add TypeScript types

3. **Write Tests**
   ```typescript
   describe('MyExtension', () => {
     it('should work correctly', () => {
       // Test implementation
     });
   });
   ```

4. **Document**
   - Add JSDoc comments
   - Update API.md
   - Add usage examples

5. **Submit Pull Request**
   - Clear description
   - Link to related issues
   - Include before/after examples

### Code Style Guidelines

```typescript
// ✅ Good: Clear, typed, documented
/**
 * Calculates moving average for a dataset
 * @param data - Array of numeric values
 * @param window - Size of moving window
 * @returns Smoothed values
 */
export function movingAverage(
  data: number[], 
  window: number
): number[] {
  // Implementation...
}

// ❌ Bad: No types, no docs
export function movingAverage(data, window) {
  // Implementation...
}
```

## Examples Repository

Check out [charts-examples](https://github.com/thomasfosterau/charts-examples) for:
- Complete custom component examples
- Custom renderer implementations
- Advanced data transformations
- Theme examples
- Integration examples

## Support

- **Questions**: [GitHub Discussions](https://github.com/thomasfosterau/charts/discussions)
- **Bugs**: [GitHub Issues](https://github.com/thomasfosterau/charts/issues)
- **Features**: [GitHub Issues](https://github.com/thomasfosterau/charts/issues)
- **Chat**: [Discord](https://discord.gg/charts)

## Conclusion

The library is designed to be extended:
- ✅ Custom components using chart context
- ✅ Custom renderers implementing interface
- ✅ Custom scales wrapping D3 or from scratch
- ✅ Custom themes following type definitions
- ✅ Data transformers as pure functions

With these extension points, you can:
- Build domain-specific chart types
- Support new rendering targets
- Create specialized data transformations
- Design custom visual styles

Happy extending!
