# Tutorial: Custom Components

Learn how to create your own custom chart components using the Pancake coordinate system and renderer API.

## Prerequisites

- Complete previous tutorials
- Understanding of Svelte component lifecycle
- Familiarity with the Pancake coordinate system (0-100 percentages)

## Understanding the Chart Context

Every chart component has access to the chart context, which provides:

```typescript
interface ChartContext {
  renderer: Renderer;      // The active renderer (SVG/Canvas/WebGPU)
  width: number;           // Chart width in pixels
  height: number;          // Chart height in pixels
  margin: Margin;          // Chart margins
}
```

### Getting the Context

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  
  const { renderer, width, height, margin } = getChartContext();
</script>
```

## The Pancake Coordinate System

All positions use percentages (0-100) instead of pixels:

- **x: 0** = Left edge, **x: 100** = Right edge
- **y: 0** = Top edge, **y: 100** = Bottom edge

This makes components work across all render targets without modification.

### Example: Drawing a Line

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';

  const { renderer } = getChartContext();

  onMount(() => {
    // Draw a diagonal line from top-left to bottom-right
    renderer.beginPath();
    renderer.moveTo({ x: 10, y: 10 });  // 10% from left, 10% from top
    renderer.lineTo({ x: 90, y: 90 });  // 90% from left, 90% from top
    renderer.stroke('#000', 2);
  });
</script>
```

## Basic Custom Component: CrossHair

Let's create a component that draws a crosshair at a specific position.

```svelte
<!-- CrossHair.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import type { PancakePoint } from '@thomasfosterau/charts';

  export let position: PancakePoint = { x: 50, y: 50 };
  export let color: string = '#e53e3e';
  export let size: number = 5; // Size in percentage

  const { renderer } = getChartContext();

  onMount(() => {
    // Horizontal line
    renderer.beginPath();
    renderer.moveTo({ x: position.x - size, y: position.y });
    renderer.lineTo({ x: position.x + size, y: position.y });
    renderer.stroke(color, 1);

    // Vertical line
    renderer.beginPath();
    renderer.moveTo({ x: position.x, y: position.y - size });
    renderer.lineTo({ x: position.x, y: position.y + size });
    renderer.stroke(color, 1);
  });
</script>
```

### Using the CrossHair Component

```svelte
<script>
  import { Chart } from '@thomasfosterau/charts';
  import CrossHair from './CrossHair.svelte';
</script>

<Chart width={600} height={400}>
  <CrossHair position={{ x: 50, y: 50 }} color="#e53e3e" />
</Chart>
```

## Intermediate: Reference Lines

Create horizontal or vertical reference lines.

```svelte
<!-- ReferenceLine.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';

  export let type: 'horizontal' | 'vertical' = 'horizontal';
  export let value: number; // Percentage (0-100)
  export let label: string = '';
  export let color: string = '#718096';
  export let strokeWidth: number = 1;
  export let dashArray: string = '5,5';

  const { renderer } = getChartContext();

  onMount(() => {
    renderer.beginPath();
    
    if (type === 'horizontal') {
      renderer.moveTo({ x: 0, y: value });
      renderer.lineTo({ x: 100, y: value });
    } else {
      renderer.moveTo({ x: value, y: 0 });
      renderer.lineTo({ x: value, y: 100 });
    }
    
    renderer.stroke(color, strokeWidth);

    if (label) {
      const position = type === 'horizontal' 
        ? { x: 2, y: value - 2 }
        : { x: value + 2, y: 2 };
      
      renderer.text(position, label, {
        fontSize: 12,
        fill: color,
        textAnchor: 'start'
      });
    }
  });
</script>
```

### Usage

```svelte
<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke="#4299e1" />
  
  <!-- Add reference lines -->
  <ReferenceLine type="horizontal" value={50} label="Average" color="#48bb78" />
  <ReferenceLine type="vertical" value={75} label="Target" color="#ed8936" />
  
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" />
</Chart>
```

## Advanced: Range Indicator

Create a component that highlights a range between two values.

```svelte
<!-- RangeIndicator.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import type { PancakeCoordinates } from '@thomasfosterau/charts';

  export let x1: number = 0;
  export let x2: number = 100;
  export let y1: number = 0;
  export let y2: number = 100;
  export let fill: string = 'rgba(66, 153, 225, 0.1)';
  export let stroke: string = '#4299e1';
  export let label: string = '';

  const { renderer } = getChartContext();

  onMount(() => {
    const coords: PancakeCoordinates = { x1, y1, x2, y2 };
    
    // Draw the rectangle
    renderer.rect(coords, fill, stroke);
    
    // Add label if provided
    if (label) {
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      
      renderer.text({ x: centerX, y: centerY }, label, {
        fontSize: 14,
        fill: stroke,
        textAnchor: 'middle',
        baseline: 'middle'
      });
    }
  });
</script>
```

### Usage

```svelte
<Chart width={600} height={400}>
  <!-- Highlight a range -->
  <RangeIndicator 
    x1={20} 
    x2={40} 
    y1={0} 
    y2={100} 
    fill="rgba(72, 187, 120, 0.1)"
    stroke="#48bb78"
    label="Target Range"
  />
  
  <Line {data} x="x" y="y" stroke="#4299e1" />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" />
</Chart>
```

## Data-Driven Custom Chart: Candlestick

Create a candlestick chart component for financial data.

```svelte
<!-- Candlestick.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import type { DataPoint, Scale } from '@thomasfosterau/charts';
  import { pancakeToPixels } from '@thomasfosterau/charts';

  export let data: DataPoint[];
  export let xScale: Scale;
  export let yScale: Scale;
  export let upColor: string = '#48bb78';
  export let downColor: string = '#e53e3e';
  export let wickWidth: number = 1;
  export let bodyWidth: number = 8;

  const { renderer, width, height, margin } = getChartContext();

  onMount(() => {
    data.forEach((d) => {
      const open = d.open as number;
      const close = d.close as number;
      const high = d.high as number;
      const low = d.low as number;
      const x = xScale(d.date);

      // Convert to pancake coordinates
      const xPos = pancakeToPixels(x, width, margin.left, margin.right);
      const openY = pancakeToPixels(yScale(open), height, margin.top, margin.bottom);
      const closeY = pancakeToPixels(yScale(close), height, margin.top, margin.bottom);
      const highY = pancakeToPixels(yScale(high), height, margin.top, margin.bottom);
      const lowY = pancakeToPixels(yScale(low), height, margin.top, margin.bottom);

      const isUp = close > open;
      const color = isUp ? upColor : downColor;

      // Draw wick (high to low)
      renderer.beginPath();
      renderer.moveTo({ x: xPos, y: highY });
      renderer.lineTo({ x: xPos, y: lowY });
      renderer.stroke(color, wickWidth);

      // Draw body (open to close)
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = bodyBottom - bodyTop;

      renderer.rect(
        {
          x1: xPos - bodyWidth / 2,
          y1: bodyTop,
          x2: xPos + bodyWidth / 2,
          y2: bodyBottom
        },
        color,
        color
      );
    });
  });
</script>
```

### Usage

```svelte
<script>
  import { Chart, Axis, Candlestick } from './components';
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { date: new Date('2024-01-01'), open: 100, close: 110, high: 115, low: 95 },
    { date: new Date('2024-01-02'), open: 110, close: 105, high: 112, low: 102 },
    // ... more data
  ];

  const xScale = createScale('time')
    .domain([data[0].date, data[data.length - 1].date])
    .range([50, 550]);

  const allPrices = data.flatMap(d => [d.open, d.close, d.high, d.low]);
  const yScale = createScale('linear')
    .domain([Math.min(...allPrices), Math.max(...allPrices)])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Candlestick {data} {xScale} {yScale} />
  <Axis scale={xScale} type="x" position="bottom" label="Date" />
  <Axis scale={yScale} type="y" position="left" label="Price" gridLines />
</Chart>
```

## Reactive Custom Components

Make your components reactive to data changes using Svelte's reactive statements.

```svelte
<!-- ReactiveCircle.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import type { PancakePoint } from '@thomasfosterau/charts';

  export let position: PancakePoint;
  export let radius: number = 5;
  export let fill: string = '#4299e1';

  const { renderer } = getChartContext();

  // Redraw when props change
  $: if (renderer && position) {
    drawCircle();
  }

  function drawCircle() {
    renderer.clear(); // Clear previous drawings if needed
    renderer.circle(position, radius, fill);
  }

  onMount(() => {
    drawCircle();
  });
</script>
```

## Working with Scales

Convert data values to pancake coordinates using scales.

```svelte
<script lang="ts">
  import { getChartContext } from '@thomasfosterau/charts';
  import { pixelsToPancake } from '@thomasfosterau/charts';
  import type { Scale } from '@thomasfosterau/charts';

  export let data: DataPoint[];
  export let xScale: Scale;
  export let yScale: Scale;

  const { renderer, width, height, margin } = getChartContext();

  onMount(() => {
    data.forEach(d => {
      // Get pixel position from scale
      const xPixel = xScale(d.x);
      const yPixel = yScale(d.y);

      // Convert to pancake coordinates
      const x = pixelsToPancake(xPixel, width, margin.left, margin.right);
      const y = pixelsToPancake(yPixel, height, margin.top, margin.bottom);

      // Draw something at this position
      renderer.circle({ x, y }, 3, '#4299e1');
    });
  });
</script>
```

## Renderer Methods Reference

Here are the key renderer methods you can use:

### Path Drawing

```typescript
renderer.beginPath();
renderer.moveTo({ x: 10, y: 10 });
renderer.lineTo({ x: 90, y: 90 });
renderer.closePath();
renderer.stroke(color, width);
renderer.fill(color);
```

### Shapes

```typescript
// Circle
renderer.circle({ x: 50, y: 50 }, radius, fill, stroke);

// Rectangle
renderer.rect({ x1: 10, y1: 10, x2: 90, y2: 90 }, fill, stroke);
```

### Text

```typescript
renderer.text({ x: 50, y: 50 }, 'Hello', {
  fontSize: 14,
  fill: '#000',
  textAnchor: 'middle',
  baseline: 'middle'
});
```

### Opacity

```typescript
renderer.setOpacity(0.5);
// Draw something semi-transparent
renderer.setOpacity(1.0); // Reset
```

## Best Practices

### 1. Always Use onMount

Renderer operations must happen after the component is mounted:

```svelte
<script>
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Renderer operations here
  });
</script>
```

### 2. Clean Up Resources

If your component creates expensive resources, clean them up:

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  
  let animationFrame;
  
  onMount(() => {
    // Start animation
    animationFrame = requestAnimationFrame(animate);
  });
  
  onDestroy(() => {
    // Stop animation
    cancelAnimationFrame(animationFrame);
  });
</script>
```

### 3. Use TypeScript

Type your props for better developer experience:

```typescript
export let data: DataPoint[];
export let color: string = '#4299e1';
export let position: PancakePoint;
```

### 4. Document Your Component

```svelte
<!--
  RefereneceLine component
  
  Draws a horizontal or vertical reference line across the chart.
  
  Props:
  - type: 'horizontal' | 'vertical' - Line orientation
  - value: number - Position (0-100 in pancake coordinates)
  - label: string - Optional label text
  - color: string - Line color
-->
<script lang="ts">
  // ... component code
</script>
```

### 5. Make Components Composable

Design components to work well together:

```svelte
<Chart width={600} height={400}>
  <ReferenceLine type="horizontal" value={50} />
  <RangeIndicator x1={20} x2={40} y1={0} y2={100} />
  <Line {data} x="x" y="y" />
  <Scatter data={highlights} x="x" y="y" />
</Chart>
```

## Testing Custom Components

```svelte
<!-- Test.svelte -->
<script>
  import { Chart } from '@thomasfosterau/charts';
  import MyCustomComponent from './MyCustomComponent.svelte';

  const testData = [
    // ... test data
  ];
</script>

<h2>Testing MyCustomComponent</h2>

<Chart width={600} height={400}>
  <MyCustomComponent data={testData} />
</Chart>
```

## Example: Complete Custom Histogram

Here's a complete example combining everything we've learned:

```svelte
<!-- Histogram.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';
  import { pixelsToPancake } from '@thomasfosterau/charts';
  import type { Scale } from '@thomasfosterau/charts';

  export let data: number[];
  export let bins: number = 10;
  export let xScale: Scale;
  export let yScale: Scale;
  export let fill: string = '#4299e1';
  export let stroke: string = '#2c5282';

  const { renderer, width, height, margin } = getChartContext();

  onMount(() => {
    // Calculate histogram bins
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0);
    data.forEach(value => {
      const binIndex = Math.min(
        Math.floor((value - min) / binWidth),
        bins - 1
      );
      histogram[binIndex]++;
    });

    // Draw histogram bars
    histogram.forEach((count, i) => {
      const x1 = xScale(min + i * binWidth);
      const x2 = xScale(min + (i + 1) * binWidth);
      const y1 = yScale(count);
      const y2 = yScale(0);

      const pancakeCoords = {
        x1: pixelsToPancake(x1, width, margin.left, margin.right),
        y1: pixelsToPancake(y1, height, margin.top, margin.bottom),
        x2: pixelsToPancake(x2, width, margin.left, margin.right),
        y2: pixelsToPancake(y2, height, margin.top, margin.bottom)
      };

      renderer.rect(pancakeCoords, fill, stroke);
    });
  });
</script>
```

## Next Steps

- Review the [API Reference](../api/README.md) for complete method documentation
- Check the [Renderer Guide](../api/renderers.md) for advanced rendering techniques
- Study existing components in the library source code for more examples
- Experiment with creating your own unique visualizations!

## Resources

- [D3 Scale Documentation](https://github.com/d3/d3-scale)
- [Pancake Charts Inspiration](https://pancake-charts.surge.sh/)
- [Svelte Component Documentation](https://svelte.dev/docs)
