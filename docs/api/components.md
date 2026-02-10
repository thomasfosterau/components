# Components API Reference

Complete reference for all chart components in @thomasfosterau/charts.

## Chart

The root container component that sets up the rendering context for all child components.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `600` | Chart width in pixels |
| `height` | `number` | `400` | Chart height in pixels |
| `margin` | `Margin` | `{ top: 20, right: 20, bottom: 40, left: 50 }` | Chart margins |
| `renderTarget` | `RenderTarget` | `'svg'` | Render target: 'svg', 'canvas', or 'webgpu' |
| `theme` | `Theme` | `defaultTheme` | Theme object for styling |

### Usage

```svelte
<script>
  import { Chart } from '@thomasfosterau/charts';
</script>

<Chart width={800} height={600} renderTarget="svg">
  <!-- Chart components go here -->
</Chart>
```

### With Custom Margin

```svelte
<Chart 
  width={600} 
  height={400}
  margin={{ top: 30, right: 40, bottom: 50, left: 60 }}
>
  <!-- More space for labels -->
</Chart>
```

### With Theme

```svelte
<script>
  import { Chart } from '@thomasfosterau/charts';
  import { darkTheme } from '@thomasfosterau/charts';
</script>

<Chart width={600} height={400} theme={darkTheme}>
  <!-- Themed components -->
</Chart>
```

---

## Line

Renders a line chart connecting data points.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | **required** | Array of data points |
| `x` | `string` | **required** | Key for x values |
| `y` | `string` | **required** | Key for y values |
| `stroke` | `string` | `'#4299e1'` | Line color |
| `strokeWidth` | `number` | `2` | Line width in pixels |
| `fill` | `string \| undefined` | `undefined` | Fill color for area under line |
| `xScale` | `Scale` | auto | X-axis scale (auto-generated if not provided) |
| `yScale` | `Scale` | auto | Y-axis scale (auto-generated if not provided) |

### Usage

**Basic Line Chart:**

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 20 },
    { x: 3, y: 35 }
  ];

  const xScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.x), 0))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(data.map(d => d.y), 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

**Area Chart (filled line):**

```svelte
<Line 
  {data} 
  x="x" 
  y="y" 
  stroke="#48bb78" 
  strokeWidth={2}
  fill="rgba(72, 187, 120, 0.2)"
/>
```

**Multiple Lines:**

```svelte
<Chart width={600} height={400}>
  <Line data={series1} x="x" y="y" stroke="#4299e1" />
  <Line data={series2} x="x" y="y" stroke="#48bb78" />
  <Line data={series3} x="x" y="y" stroke="#ed8936" />
</Chart>
```

---

## Bar

Renders vertical bar chart.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | **required** | Array of data points |
| `x` | `string` | **required** | Key for x values (categories) |
| `y` | `string` | **required** | Key for y values |
| `fill` | `string` | `'#4299e1'` | Bar fill color |
| `stroke` | `string \| undefined` | `undefined` | Bar border color |
| `barWidth` | `number` | `0.8` | Bar width as fraction of available space (0-1) |
| `xScale` | `Scale` | auto | X-axis scale (typically band scale) |
| `yScale` | `Scale` | auto | Y-axis scale |

### Usage

**Basic Bar Chart:**

```svelte
<script>
  import { Chart, Bar, Axis } from '@thomasfosterau/charts';
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { category: 'A', value: 30 },
    { category: 'B', value: 50 },
    { category: 'C', value: 35 }
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

**With Border:**

```svelte
<Bar 
  {data} 
  x="category" 
  y="value" 
  fill="#805ad5" 
  stroke="#553c9a"
/>
```

**Thin Bars:**

```svelte
<Bar {data} x="category" y="value" fill="#48bb78" barWidth={0.6} />
```

---

## Scatter

Renders a scatter plot with circular points.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | **required** | Array of data points |
| `x` | `string` | **required** | Key for x values |
| `y` | `string` | **required** | Key for y values |
| `fill` | `string` | `'#4299e1'` | Point fill color |
| `stroke` | `string \| undefined` | `undefined` | Point border color |
| `radius` | `number` | `4` | Point radius in pixels |
| `xScale` | `Scale` | auto | X-axis scale |
| `yScale` | `Scale` | auto | Y-axis scale |

### Usage

**Basic Scatter Plot:**

```svelte
<script>
  import { Chart, Scatter, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 10, y: 20 },
    { x: 15, y: 35 },
    { x: 25, y: 30 },
    { x: 30, y: 45 }
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

**With Border:**

```svelte
<Scatter 
  {data} 
  x="x" 
  y="y" 
  radius={6}
  fill="#9f7aea" 
  stroke="#6b46c1"
/>
```

**Multiple Scatter Series:**

```svelte
<Chart width={600} height={400}>
  <Scatter data={dataset1} x="x" y="y" radius={5} fill="#4299e1" />
  <Scatter data={dataset2} x="x" y="y" radius={5} fill="#48bb78" />
  <Scatter data={dataset3} x="x" y="y" radius={5} fill="#ed8936" />
</Chart>
```

---

## Area

Renders an area chart (filled line chart).

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | **required** | Array of data points |
| `x` | `string` | **required** | Key for x values |
| `y` | `string` | **required** | Key for y values |
| `fill` | `string` | `'rgba(66, 153, 225, 0.3)'` | Area fill color |
| `stroke` | `string` | `'#4299e1'` | Line color |
| `strokeWidth` | `number` | `2` | Line width in pixels |
| `xScale` | `Scale` | auto | X-axis scale |
| `yScale` | `Scale` | auto | Y-axis scale |

### Usage

**Basic Area Chart:**

```svelte
<script>
  import { Chart, Area, Axis } from '@thomasfosterau/charts';
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
  <Area {data} x="x" y="y" fill="rgba(66, 153, 225, 0.3)" stroke="#4299e1" />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

**Note:** You can also use the `Line` component with a `fill` prop to create area charts.

---

## Pie

Renders a pie chart or donut chart.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | **required** | Array of data points |
| `valueKey` | `string` | `'value'` | Key for values |
| `labelKey` | `string` | `'label'` | Key for labels |
| `colors` | `string[]` | default palette | Array of colors for slices |
| `innerRadius` | `number` | `0` | Inner radius (0 for pie, >0 for donut) |
| `showLabels` | `boolean` | `true` | Whether to show labels |

### Usage

**Basic Pie Chart:**

```svelte
<script>
  import { Chart, Pie } from '@thomasfosterau/charts';

  const data = [
    { label: 'Category A', value: 30 },
    { label: 'Category B', value: 45 },
    { label: 'Category C', value: 25 }
  ];
</script>

<Chart width={400} height={400}>
  <Pie {data} valueKey="value" labelKey="label" />
</Chart>
```

**Donut Chart:**

```svelte
<Chart width={400} height={400}>
  <Pie {data} valueKey="value" labelKey="label" innerRadius={50} />
</Chart>
```

**Custom Colors:**

```svelte
<Pie 
  {data} 
  valueKey="value" 
  labelKey="label"
  colors={['#4299e1', '#48bb78', '#ed8936', '#9f7aea']}
/>
```

**Without Labels:**

```svelte
<Pie {data} showLabels={false} />
```

---

## Axis

Renders a chart axis with ticks, labels, and optional grid lines.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scale` | `Scale` | **required** | D3 scale instance |
| `scaleType` | `ScaleType` | `'linear'` | Type of scale |
| `type` | `'x' \| 'y'` | `'x'` | Axis orientation |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | depends on type | Axis position |
| `label` | `string` | `''` | Axis label |
| `tickCount` | `number` | `10` | Desired number of ticks |
| `tickFormat` | `function` | auto | Custom tick formatter |
| `gridLines` | `boolean` | `false` | Show grid lines |

### Usage

**Basic X-Axis:**

```svelte
<script>
  import { Axis } from '@thomasfosterau/charts';
  import { createScale } from '@thomasfosterau/charts';

  const xScale = createScale('linear')
    .domain([0, 100])
    .range([50, 550]);
</script>

<Axis scale={xScale} type="x" position="bottom" label="X Axis" />
```

**Y-Axis with Grid Lines:**

```svelte
<Axis 
  scale={yScale} 
  type="y" 
  position="left" 
  label="Y Axis"
  gridLines
/>
```

**Custom Tick Format:**

```svelte
<Axis 
  scale={yScale} 
  type="y" 
  position="left"
  tickFormat={(value) => `$${value}`}
/>
```

**Time Axis:**

```svelte
<script>
  const xScale = createScale('time')
    .domain([new Date('2024-01-01'), new Date('2024-12-31')])
    .range([50, 550]);

  const formatDate = (date) => 
    date.toLocaleDateString('en-US', { month: 'short' });
</script>

<Axis 
  scale={xScale} 
  type="x" 
  position="bottom"
  tickFormat={formatDate}
/>
```

---

## Grid

Renders grid lines separately from axes.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `xScale` | `Scale` | required | X-axis scale |
| `yScale` | `Scale` | required | Y-axis scale |
| `showX` | `boolean` | `true` | Show vertical grid lines |
| `showY` | `boolean` | `true` | Show horizontal grid lines |
| `color` | `string` | theme | Grid line color |
| `strokeWidth` | `number` | `1` | Grid line width |

### Usage

**Basic Grid:**

```svelte
<script>
  import { Grid } from '@thomasfosterau/charts';
</script>

<Chart width={600} height={400}>
  <Grid xScale={xScale} yScale={yScale} showX showY />
  <Line {data} x="x" y="y" />
</Chart>
```

**Custom Styled Grid:**

```svelte
<Grid 
  xScale={xScale} 
  yScale={yScale}
  showX={true}
  showY={true}
  color="rgba(0, 0, 0, 0.05)"
  strokeWidth={1}
/>
```

---

## Legend

Renders a chart legend.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LegendItem[]` | **required** | Array of legend items |
| `position` | `LegendPosition` | `'top-right'` | Legend position |

**LegendItem:**
```typescript
interface LegendItem {
  label: string;
  color: string;
  shape?: 'circle' | 'square' | 'line';
}
```

**LegendPosition:**
```typescript
type LegendPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'left' | 'right';
```

### Usage

**Basic Legend:**

```svelte
<script>
  import { Chart, Line, Legend } from '@thomasfosterau/charts';

  const legendItems = [
    { label: 'Series 1', color: '#4299e1' },
    { label: 'Series 2', color: '#48bb78' },
    { label: 'Series 3', color: '#ed8936' }
  ];
</script>

<Chart width={600} height={400}>
  <Line data={data1} x="x" y="y" stroke="#4299e1" />
  <Line data={data2} x="x" y="y" stroke="#48bb78" />
  <Line data={data3} x="x" y="y" stroke="#ed8936" />
  
  <Legend items={legendItems} position="top-right" />
</Chart>
```

**Bottom Legend:**

```svelte
<Legend items={legendItems} position="bottom-center" />
```

**Custom Shapes:**

```svelte
<script>
  const legendItems = [
    { label: 'Line', color: '#4299e1', shape: 'line' },
    { label: 'Points', color: '#48bb78', shape: 'circle' },
    { label: 'Bars', color: '#ed8936', shape: 'square' }
  ];
</script>

<Legend items={legendItems} position="top-left" />
```

---

## Best Practices

### 1. Always Provide Required Props

```svelte
<!-- ❌ Missing required props -->
<Line data={[]} />

<!-- ✅ All required props provided -->
<Line {data} x="x" y="y" />
```

### 2. Use Scales Consistently

```svelte
<!-- Create scales once and reuse -->
<script>
  const xScale = createScale('linear').domain([0, 100]).range([50, 550]);
  const yScale = createScale('linear').domain([0, 100]).range([360, 40]);
</script>

<Chart>
  <Line {data} x="x" y="y" {xScale} {yScale} />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" />
</Chart>
```

### 3. Provide Meaningful Labels

```svelte
<Axis scale={xScale} type="x" position="bottom" label="Time (hours)" />
<Axis scale={yScale} type="y" position="left" label="Temperature (°C)" />
```

### 4. Use Appropriate Chart Types

- **Line**: Trends over time, continuous data
- **Bar**: Categorical comparisons
- **Scatter**: Relationships between variables
- **Area**: Volume or cumulative data
- **Pie**: Parts of a whole (use sparingly)

## Further Reading

- [Utilities Reference](./utilities.md) - Helper functions
- [Renderers Reference](./renderers.md) - Rendering backends
- [Basic Charts Tutorial](../tutorials/01-basic-charts.md) - Learn by example
- [API Overview](./README.md) - Quick reference
