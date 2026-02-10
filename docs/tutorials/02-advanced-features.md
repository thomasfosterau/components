# Tutorial: Advanced Features

This tutorial covers advanced features like custom scales, theming, grid lines, legends, and data transformations.

## Prerequisites

- Complete [Tutorial: Basic Charts](./01-basic-charts.md)
- Understanding of scales and axes
- Familiarity with D3 scale types

## Advanced Scale Types

### Logarithmic Scales

Use log scales for data that spans multiple orders of magnitude:

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { x: 1, y: 10 },
    { x: 2, y: 100 },
    { x: 3, y: 1000 },
    { x: 4, y: 10000 },
    { x: 5, y: 100000 }
  ];

  const xScale = createScale('linear')
    .domain([1, 5])
    .range([50, 550]);

  // Logarithmic scale for y-axis
  const yScale = createScale('log')
    .domain([10, 100000])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
  <Axis scale={xScale} type="x" position="bottom" label="X" />
  <Axis scale={yScale} type="y" position="left" label="Log Scale" gridLines />
</Chart>
```

### Time Scales

Perfect for time-series data:

```svelte
<script>
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { date: new Date('2024-01-01'), value: 100 },
    { date: new Date('2024-02-01'), value: 120 },
    { date: new Date('2024-03-01'), value: 105 },
    { date: new Date('2024-04-01'), value: 140 },
    { date: new Date('2024-05-01'), value: 135 }
  ];

  const xScale = createScale('time')
    .domain([data[0].date, data[data.length - 1].date])
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain([80, 160])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line {data} x="date" y="value" stroke="#48bb78" strokeWidth={2} />
  <Axis 
    scale={xScale} 
    type="x" 
    position="bottom" 
    label="Date"
    tickFormat={(d) => d.toLocaleDateString('en-US', { month: 'short' })}
  />
  <Axis scale={yScale} type="y" position="left" label="Value" gridLines />
</Chart>
```

### Power and Square Root Scales

Use power scales for non-linear relationships:

```svelte
<script>
  // Square root scale (power of 0.5)
  const sqrtScale = createScale('sqrt')
    .domain([0, 100])
    .range([40, 360]);

  // Custom power scale
  const powerScale = createScale('pow')
    .exponent(2)  // Squared
    .domain([0, 10])
    .range([40, 360]);
</script>
```

### Point Scales

Point scales are like band scales but without width:

```svelte
<script>
  const xScale = createScale('point')
    .domain(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
    .range([50, 550])
    .padding(0.5);
</script>
```

## Custom Tick Formatting

### Numeric Formatting

```svelte
<script>
  import { formatNumber } from '@thomasfosterau/charts';

  const tickFormat = (value) => {
    if (value >= 1000000) return `${value / 1000000}M`;
    if (value >= 1000) return `${value / 1000}K`;
    return value.toString();
  };
</script>

<Axis 
  scale={yScale} 
  type="y" 
  position="left" 
  tickFormat={tickFormat}
/>
```

### Date Formatting

```svelte
<script>
  const dateFormat = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
</script>

<Axis 
  scale={xScale} 
  type="x" 
  position="bottom" 
  tickFormat={dateFormat}
/>
```

### Percentage Formatting

```svelte
<script>
  const percentFormat = (value) => `${(value * 100).toFixed(1)}%`;
</script>

<Axis 
  scale={yScale} 
  type="y" 
  position="left" 
  tickFormat={percentFormat}
  label="Percentage"
/>
```

## Theming

### Using Built-in Themes

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  import { darkTheme, defaultTheme } from '@thomasfosterau/charts';
  
  let currentTheme = defaultTheme;
  
  function toggleTheme() {
    currentTheme = currentTheme === defaultTheme ? darkTheme : defaultTheme;
  }
</script>

<button on:click={toggleTheme}>Toggle Theme</button>

<Chart width={600} height={400} theme={currentTheme}>
  <Line {data} x="x" y="y" stroke={currentTheme.colors.primary} />
</Chart>
```

### Color Palettes

```svelte
<script>
  import { colorPalettes, getColorFromPalette } from '@thomasfosterau/charts';

  // Use a color palette
  const colors = ['default', 'pastel', 'vibrant', 'monochrome'];
  
  const series = [
    { data: data1, label: 'Series 1' },
    { data: data2, label: 'Series 2' },
    { data: data3, label: 'Series 3' }
  ];
</script>

<Chart width={600} height={400}>
  {#each series as s, i}
    <Line 
      data={s.data} 
      x="x" 
      y="y" 
      stroke={getColorFromPalette('vibrant', i)}
    />
  {/each}
</Chart>
```

### Custom Theme

```svelte
<script>
  import { mergeTheme, defaultTheme } from '@thomasfosterau/charts';

  const customTheme = mergeTheme(defaultTheme, {
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      background: '#1a1a2e',
      text: '#eee'
    },
    fonts: {
      base: 'Inter, sans-serif'
    }
  });
</script>

<Chart width={600} height={400} theme={customTheme}>
  <!-- Your chart components -->
</Chart>
```

## Grid Lines and Background

### Customizing Grid Lines

```svelte
<script>
  import { Grid } from '@thomasfosterau/charts';
</script>

<Chart width={600} height={400}>
  <!-- Standalone grid component -->
  <Grid 
    xScale={xScale} 
    yScale={yScale}
    showX={true}
    showY={true}
  />
  
  <Line {data} x="x" y="y" stroke="#4299e1" />
  
  <!-- Or use axis gridLines prop -->
  <Axis scale={xScale} type="x" position="bottom" gridLines />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

## Legends

### Basic Legend

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

### Legend Positions

Available positions:
- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`
- `left`
- `right`

```svelte
<Legend items={legendItems} position="bottom-center" />
```

## Chart Margins

Control the space around your chart:

```svelte
<Chart 
  width={600} 
  height={400}
  margin={{ top: 30, right: 40, bottom: 50, left: 60 }}
>
  <!-- Chart components -->
</Chart>
```

Larger margins provide more space for labels and titles.

## Multiple Axes

Create dual-axis charts:

```svelte
<script>
  const leftYScale = createScale('linear')
    .domain([0, 100])
    .range([360, 40]);

  const rightYScale = createScale('linear')
    .domain([0, 1000])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line data={dataset1} x="x" y="y" stroke="#4299e1" />
  <Line data={dataset2} x="x" y="y" stroke="#48bb78" />
  
  <Axis scale={xScale} type="x" position="bottom" label="Time" />
  <Axis scale={leftYScale} type="y" position="left" label="Temperature (°C)" />
  <Axis scale={rightYScale} type="y" position="right" label="Humidity (%)" />
</Chart>
```

## Data Transformations

### Aggregating Data

```svelte
<script>
  // Calculate moving average
  function movingAverage(data, window = 3) {
    return data.map((point, index) => {
      const start = Math.max(0, index - Math.floor(window / 2));
      const end = Math.min(data.length, index + Math.ceil(window / 2));
      const subset = data.slice(start, end);
      const avg = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
      return { ...point, y: avg };
    });
  }

  const smoothedData = movingAverage(rawData, 5);
</script>

<Chart width={600} height={400}>
  <Line data={rawData} x="x" y="y" stroke="#cbd5e0" strokeWidth={1} />
  <Line data={smoothedData} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
</Chart>
```

### Filtering Data

```svelte
<script>
  // Filter outliers
  function removeOutliers(data, threshold = 2) {
    const values = data.map(d => d.y);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    return data.filter(d => Math.abs(d.y - mean) <= threshold * stdDev);
  }

  const cleanData = removeOutliers(rawData);
</script>
```

### Grouping Data

```svelte
<script>
  // Group by category and sum
  function groupBy(data, key) {
    return Object.entries(
      data.reduce((acc, item) => {
        const group = item[key];
        acc[group] = (acc[group] || 0) + item.value;
        return acc;
      }, {})
    ).map(([category, value]) => ({ category, value }));
  }

  const groupedData = groupBy(rawData, 'category');
</script>

<Chart width={600} height={400}>
  <Bar data={groupedData} x="category" y="value" fill="#48bb78" />
</Chart>
```

## Responsive Charts

### Using Container Queries

```svelte
<script>
  import { onMount } from 'svelte';
  
  let width = 600;
  let height = 400;
  let container;

  onMount(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    });

    observer.observe(container);
    return () => observer.disconnect();
  });
</script>

<div bind:this={container} style="width: 100%; height: 400px;">
  <Chart {width} {height}>
    <Line {data} x="x" y="y" stroke="#4299e1" />
  </Chart>
</div>
```

### Aspect Ratios

```svelte
<script>
  // Maintain 16:9 aspect ratio
  $: height = width * (9 / 16);
</script>

<Chart {width} {height}>
  <!-- Chart components -->
</Chart>
```

## Performance Optimization

### Use Canvas for Large Datasets

```svelte
<Chart width={800} height={600} renderTarget="canvas">
  <Line {data} x="x" y="y" stroke="#4299e1" />
</Chart>
```

Canvas rendering is much faster than SVG for:
- Datasets with >1000 points
- Animated charts
- Real-time data streaming

### Use WebGPU for Complex Visualizations

```svelte
<Chart width={800} height={600} renderTarget="webgpu">
  <!-- Complex visualizations -->
</Chart>
```

**Note**: WebGPU requires a compatible browser and is still experimental.

## Accessibility

### Adding Labels

```svelte
<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke="#4299e1" />
  <Axis scale={xScale} type="x" position="bottom" label="Time (hours)" />
  <Axis scale={yScale} type="y" position="left" label="Temperature (°C)" />
</Chart>
```

Always include:
- Axis labels to explain what the data represents
- Clear legend items for multiple series
- Descriptive titles (using HTML around the Chart)

## Error Handling

### Handling Empty Data

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  export let data = [];

  $: hasData = data && data.length > 0;
</script>

{#if hasData}
  <Chart width={600} height={400}>
    <Line {data} x="x" y="y" stroke="#4299e1" />
  </Chart>
{:else}
  <div class="no-data">No data available</div>
{/if}
```

### Validating Scales

```svelte
<script>
  import { getNiceDomain } from '@thomasfosterau/charts';

  function createSafeScale(values, padding = 0.1) {
    if (!values || values.length === 0) {
      return [0, 100]; // Default domain
    }
    return getNiceDomain(values, padding);
  }

  const yDomain = createSafeScale(data.map(d => d.y));
</script>
```

## Next Steps

- [Tutorial: Custom Components](./03-custom-components.md) - Build your own chart types
- [Guide: Theming](../guides/theming.md) - Complete theming guide
- [Guide: Render Targets](../guides/render-targets.md) - SVG vs Canvas vs WebGPU
- [API Reference](../api/README.md) - Complete API documentation
