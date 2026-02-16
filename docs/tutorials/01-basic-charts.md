# Tutorial: Basic Charts

This tutorial covers all the basic chart types available in @thomasfosterau/charts. By the end, you'll know how to create line charts, bar charts, scatter plots, area charts, and pie charts.

## Prerequisites

- Complete the [Getting Started Guide](../getting-started.md)
- Basic understanding of Svelte components
- Familiarity with JavaScript arrays and objects

## Line Charts

Line charts are perfect for showing trends over time or continuous data.

### Basic Line Chart

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 20 },
    { x: 3, y: 35 },
    { x: 4, y: 30 },
    { x: 5, y: 45 }
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
  <Axis scale={xScale} type="x" position="bottom" label="Time" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Value" gridLines />
</Chart>
```

### Multiple Lines

You can display multiple data series by adding multiple Line components:

```svelte
<script>
  const series1 = [
    { x: 0, y: 10 },
    { x: 1, y: 25 },
    { x: 2, y: 20 }
  ];

  const series2 = [
    { x: 0, y: 15 },
    { x: 1, y: 20 },
    { x: 2, y: 30 }
  ];

  // Create scales from combined data
  const allYValues = [...series1, ...series2].map(d => d.y);
  const yScale = createScale('linear')
    .domain(getNiceDomain(allYValues, 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line data={series1} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
  <Line data={series2} x="x" y="y" stroke="#48bb78" strokeWidth={2} />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

### Styling Options

Line components support various styling options:

```svelte
<Line 
  {data} 
  x="x" 
  y="y" 
  stroke="#e53e3e"          <!-- Line color -->
  strokeWidth={3}            <!-- Line thickness -->
  fill="rgba(229,62,62,0.2)" <!-- Fill area under line -->
/>
```

## Bar Charts

Bar charts are ideal for comparing categorical data or discrete values.

### Vertical Bar Chart

```svelte
<script>
  import { Chart, Bar, Axis } from '@thomasfosterau/charts';
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { category: 'A', value: 30 },
    { category: 'B', value: 50 },
    { category: 'C', value: 35 },
    { category: 'D', value: 60 },
    { category: 'E', value: 45 }
  ];

  const categories = data.map(d => d.category);
  const values = data.map(d => d.value);

  const xScale = createScale('band')
    .domain(categories)
    .range([50, 550])
    .padding(0.2);

  const yScale = createScale('linear')
    .domain([0, Math.max(...values)])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Bar {data} x="category" y="value" fill="#48bb78" />
  <Axis scale={xScale} type="x" position="bottom" label="Category" />
  <Axis scale={yScale} type="y" position="left" label="Value" gridLines />
</Chart>
```

### Styling Bars

```svelte
<Bar 
  {data} 
  x="category" 
  y="value" 
  fill="#805ad5"        <!-- Bar fill color -->
  stroke="#553c9a"      <!-- Bar border color -->
  barWidth={0.6}        <!-- Width as fraction (0-1) -->
/>
```

### Band Scales

Bar charts use **band scales** for categorical data:

```javascript
const xScale = createScale('band')
  .domain(categories)     // Array of category names
  .range([50, 550])       // Pixel range
  .padding(0.2);          // Space between bars (0-1)
```

## Scatter Plots

Scatter plots show the relationship between two variables.

### Basic Scatter Plot

```svelte
<script>
  import { Chart, Scatter, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { x: 10, y: 20 },
    { x: 15, y: 35 },
    { x: 25, y: 30 },
    { x: 30, y: 45 },
    { x: 40, y: 50 },
    { x: 45, y: 40 },
    { x: 55, y: 60 }
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
  <Axis scale={xScale} type="x" position="bottom" label="X Value" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Y Value" gridLines />
</Chart>
```

### Customizing Points

```svelte
<Scatter 
  {data} 
  x="x" 
  y="y" 
  radius={6}             <!-- Point size -->
  fill="#9f7aea"         <!-- Fill color -->
  stroke="#6b46c1"       <!-- Border color -->
/>
```

### Multiple Scatter Series

```svelte
<Chart width={600} height={400}>
  <Scatter data={dataset1} x="x" y="y" radius={5} fill="#4299e1" />
  <Scatter data={dataset2} x="x" y="y" radius={5} fill="#48bb78" />
  <Scatter data={dataset3} x="x" y="y" radius={5} fill="#ed8936" />
</Chart>
```

## Area Charts

Area charts are line charts with the area beneath filled in, useful for showing cumulative data or volume.

### Basic Area Chart

```svelte
<script>
  import { Chart, Area, Axis } from '@thomasfosterau/charts';
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

<Chart width={600} height={400}>
  <Area {data} x="x" y="y" fill="rgba(66, 153, 225, 0.3)" stroke="#4299e1" />
  <Axis scale={xScale} type="x" position="bottom" label="Time" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Value" gridLines />
</Chart>
```

**Note**: The Line component can also create area charts by setting the `fill` prop:

```svelte
<Line {data} x="x" y="y" stroke="#4299e1" fill="rgba(66, 153, 225, 0.2)" />
```

## Pie Charts

Pie charts display parts of a whole, showing proportional data.

### Basic Pie Chart

```svelte
<script>
  import { Chart, Pie } from '@thomasfosterau/charts';

  const data = [
    { label: 'Category A', value: 30 },
    { label: 'Category B', value: 45 },
    { label: 'Category C', value: 25 },
    { label: 'Category D', value: 50 }
  ];
</script>

<Chart width={400} height={400}>
  <Pie {data} valueKey="value" labelKey="label" />
</Chart>
```

### Donut Chart

Create a donut chart by setting the `innerRadius`:

```svelte
<Chart width={400} height={400}>
  <Pie {data} valueKey="value" labelKey="label" innerRadius={50} />
</Chart>
```

### Custom Colors

```svelte
<Pie 
  {data} 
  valueKey="value" 
  labelKey="label"
  colors={['#4299e1', '#48bb78', '#ed8936', '#9f7aea']}
  showLabels={true}
/>
```

## Combining Charts

You can combine multiple chart types in the same Chart component:

```svelte
<Chart width={600} height={400}>
  <!-- Area chart as background -->
  <Area data={areaData} x="x" y="y" fill="rgba(66, 153, 225, 0.2)" stroke="none" />
  
  <!-- Line chart on top -->
  <Line data={lineData} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
  
  <!-- Scatter points highlight specific data -->
  <Scatter data={highlights} x="x" y="y" radius={6} fill="#e53e3e" />
  
  <!-- Axes -->
  <Axis scale={xScale} type="x" position="bottom" gridLines />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

## Working with Real Data

### Time Series Data

```svelte
<script>
  import { createScale } from '@thomasfosterau/charts';

  // Convert dates to timestamps for scale
  const data = [
    { date: new Date('2024-01-01'), value: 100 },
    { date: new Date('2024-02-01'), value: 150 },
    { date: new Date('2024-03-01'), value: 125 }
  ];

  // Use time scale for dates
  const xScale = createScale('time')
    .domain([data[0].date, data[data.length - 1].date])
    .range([50, 550]);
</script>
```

### Large Datasets

For large datasets, consider using Canvas rendering for better performance:

```svelte
<Chart width={800} height={600} renderTarget="canvas">
  <Line {data} x="x" y="y" stroke="#4299e1" />
</Chart>
```

## Exercise

Try creating a chart that combines what you've learned:

1. Create a dataset with multiple series
2. Use both Line and Scatter components
3. Add custom colors and styling
4. Include axes with labels and grid lines

## Next Steps

- [Tutorial: Advanced Features](./02-advanced-features.md) - Learn about scales, theming, and more
- [Guide: Scales and Domains](../guides/scales-and-domains.md) - Deep dive into D3 scales
- [API Reference: Components](../api/components.md) - Full component documentation
