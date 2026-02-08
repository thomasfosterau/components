# Examples

This directory contains example usage of the @thomasfosterau/charts library.

## Basic Line Chart

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

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

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

## Bar Chart

```svelte
<script>
  import { Chart, Bar, Axis } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { category: 'A', value: 30 },
    { category: 'B', value: 50 },
    { category: 'C', value: 35 },
    { category: 'D', value: 60 },
    { category: 'E', value: 45 }
  ];

  const xValues = data.map(d => d.category);
  const yValues = data.map(d => d.value);

  const xScale = createScale('band')
    .domain(xValues)
    .range([50, 550])
    .padding(0.2);

  const yScale = createScale('linear')
    .domain([0, Math.max(...yValues)])
    .range([360, 40]);
</script>

<Chart width={600} height={400} renderTarget="svg">
  <Bar {data} x="category" y="value" fill="#48bb78" />
  <Axis scale={xScale} type="x" position="bottom" label="Category" />
  <Axis scale={yScale} type="y" position="left" label="Value" gridLines />
</Chart>
```

## Scatter Plot

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

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

  const xScale = createScale('linear')
    .domain(getNiceDomain(xValues, 0.1))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(yValues, 0.1))
    .range([360, 40]);
</script>

<Chart width={600} height={400} renderTarget="svg">
  <Scatter {data} x="x" y="y" radius={5} fill="#ed8936" />
  <Axis scale={xScale} type="x" position="bottom" label="X Value" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Y Value" gridLines />
</Chart>
```

## Canvas Rendering

For better performance with large datasets, use Canvas rendering:

```svelte
<Chart width={600} height={400} renderTarget="canvas">
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
</Chart>
```

## WebGPU Rendering

For GPU-accelerated rendering (requires WebGPU-capable browser):

```svelte
<Chart width={600} height={400} renderTarget="webgpu">
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} />
</Chart>
```

## Area Chart (Fill under line)

```svelte
<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="x" y="y" stroke="#4299e1" strokeWidth={2} fill="rgba(66, 153, 225, 0.2)" />
  <Axis scale={xScale} type="x" position="bottom" label="X Axis" gridLines />
  <Axis scale={yScale} type="y" position="left" label="Y Axis" gridLines />
</Chart>
```
