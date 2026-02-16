# Guide: Scales and Domains

This guide explains how to use D3 scales to map your data to visual coordinates in @thomasfosterau/charts.

## What Are Scales?

Scales are functions that map from a **domain** (your data space) to a **range** (visual space). They're the bridge between your raw data and the chart's visual representation.

```
Data Value → Scale → Visual Position
```

For example:
- Data value: `42` (temperature in Celsius)
- Scale: Linear scale from `[0, 100]` to `[0, 600]`
- Visual position: `252` (pixels from left)

## Scale Types

@thomasfosterau/charts supports all major D3 scale types:

### Continuous Scales

Map continuous domains to continuous ranges.

#### Linear Scale

Most common scale type for numeric data.

```svelte
<script>
  import { createScale } from '@thomasfosterau/charts';

  const yScale = createScale('linear')
    .domain([0, 100])      // Data range: 0 to 100
    .range([360, 40]);     // Visual range: bottom to top pixels
</script>
```

#### Logarithmic Scale

For data spanning multiple orders of magnitude.

```svelte
<script>
  const yScale = createScale('log')
    .domain([1, 1000000])  // 1 to 1 million
    .range([360, 40]);
</script>
```

**Use cases**: Population data, file sizes, exponential growth

#### Power Scale

Applies an exponent to the input.

```svelte
<script>
  const yScale = createScale('pow')
    .exponent(2)           // Square the input
    .domain([0, 10])
    .range([360, 40]);
</script>
```

#### Square Root Scale

Power scale with exponent of 0.5 (a common case).

```svelte
<script>
  const sizeScale = createScale('sqrt')
    .domain([0, 100])
    .range([0, 50]);       // Map to bubble sizes
</script>
```

**Use cases**: Bubble chart sizes, area-based visualizations

#### Time Scale

For temporal data (dates and times).

```svelte
<script>
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');

  const xScale = createScale('time')
    .domain([startDate, endDate])
    .range([50, 550]);
</script>
```

**Use cases**: Time series, historical data, trends over time

### Discrete Scales

Map discrete domains to discrete or continuous ranges.

#### Band Scale

Creates bands with optional padding. Perfect for bar charts.

```svelte
<script>
  const categories = ['A', 'B', 'C', 'D', 'E'];

  const xScale = createScale('band')
    .domain(categories)
    .range([50, 550])
    .padding(0.2);         // 20% padding between bars

  // Get position and width of each band
  const position = xScale('B');        // Returns x position
  const bandwidth = xScale.bandwidth(); // Returns width of each band
</script>
```

**Use cases**: Bar charts, grouped visualizations

#### Ordinal Scale

Maps discrete values to discrete output values.

```svelte
<script>
  const colorScale = createScale('ordinal')
    .domain(['low', 'medium', 'high'])
    .range(['#48bb78', '#ed8936', '#e53e3e']);

  const color = colorScale('high'); // Returns '#e53e3e'
</script>
```

**Use cases**: Color coding categories, symbol mapping

#### Point Scale

Like band scale but produces points instead of bands.

```svelte
<script>
  const xScale = createScale('point')
    .domain(['Jan', 'Feb', 'Mar', 'Apr'])
    .range([50, 550])
    .padding(0.5);

  const position = xScale('Feb'); // Returns center point
</script>
```

**Use cases**: Line charts with categorical x-axis, scatter plots

## Domain and Range

### Understanding Domain

The domain is the range of values in your data.

```javascript
const data = [
  { x: 10, y: 20 },
  { x: 15, y: 35 },
  { x: 25, y: 30 }
];

// Extract min and max
const xValues = data.map(d => d.x);
const xMin = Math.min(...xValues);  // 10
const xMax = Math.max(...xValues);  // 25

// Set domain
const xScale = createScale('linear')
  .domain([xMin, xMax])
  .range([50, 550]);
```

### Understanding Range

The range is the visual space available for your chart.

```javascript
const chartWidth = 600;
const margin = { left: 50, right: 50 };

const xScale = createScale('linear')
  .domain([0, 100])
  .range([margin.left, chartWidth - margin.right]); // [50, 550]
```

### Inverted Scales

For y-axis, typically invert the range (SVG y-axis goes down):

```javascript
const yScale = createScale('linear')
  .domain([0, 100])       // Data: 0 at bottom, 100 at top
  .range([360, 40]);      // Visual: 360px (bottom) to 40px (top)
```

## Using getNiceDomain

The `getNiceDomain` utility creates human-friendly domain ranges:

```svelte
<script>
  import { getNiceDomain } from '@thomasfosterau/charts';

  const values = [23, 45, 67, 89, 12, 34];

  // Without getNiceDomain
  const domain1 = [
    Math.min(...values),  // 12
    Math.max(...values)   // 89
  ];

  // With getNiceDomain (adds 10% padding and rounds)
  const domain2 = getNiceDomain(values, 0.1); // [8, 92] or similar
</script>
```

### Padding Parameter

Control how much space to add around your data:

```javascript
// No padding (tight fit)
getNiceDomain(values, 0);     // [12, 89]

// 10% padding (default)
getNiceDomain(values, 0.1);   // [8, 92]

// 20% padding (more space)
getNiceDomain(values, 0.2);   // [4, 96]
```

### When to Use getNiceDomain

✅ Use getNiceDomain for:
- Automatic, visually pleasing domains
- Quick prototyping
- When you don't need exact control

❌ Don't use getNiceDomain for:
- Fixed domains (e.g., 0-100 for percentages)
- Precise control over range
- Comparing multiple charts (use same domain)

## Creating Scales from Data

### Automatic Scale Creation

```svelte
<script>
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const data = [
    { date: new Date('2024-01-01'), value: 100 },
    { date: new Date('2024-02-01'), value: 120 },
    { date: new Date('2024-03-01'), value: 105 }
  ];

  // Extract values
  const dates = data.map(d => d.date);
  const values = data.map(d => d.value);

  // Create scales automatically
  const xScale = createScale('time')
    .domain([dates[0], dates[dates.length - 1]])
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(values, 0.1))
    .range([360, 40]);
</script>
```

### Helper Function

Create a reusable scale creator:

```javascript
function createScaleFromData(data, key, scaleType = 'linear', padding = 0.1) {
  const values = data.map(d => d[key]);
  
  return createScale(scaleType)
    .domain(getNiceDomain(values, padding))
    .range([50, 550]); // Or pass range as parameter
}

// Usage
const xScale = createScaleFromData(data, 'x', 'linear', 0);
const yScale = createScaleFromData(data, 'y', 'linear', 0.1);
```

## Scale Methods

### Converting Values

```javascript
// Data value → Visual position
const visualPosition = scale(dataValue);

// Visual position → Data value (invert)
const dataValue = scale.invert(visualPosition);
```

Example:
```javascript
const yScale = createScale('linear')
  .domain([0, 100])
  .range([400, 0]);

yScale(50);          // Returns 200 (middle)
yScale.invert(200);  // Returns 50
```

### Getting Scale Information

```javascript
// Get domain
const domain = scale.domain();  // [0, 100]

// Get range  
const range = scale.range();    // [400, 0]

// Band/Point scale specific
const bandwidth = xScale.bandwidth();  // Width of each band
const step = xScale.step();            // Distance between bands
```

## Working with Categorical Data

### Bar Charts

```svelte
<script>
  import { Chart, Bar, Axis } from '@thomasfosterau/charts';
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { category: 'Apple', value: 30 },
    { category: 'Banana', value: 45 },
    { category: 'Orange', value: 25 }
  ];

  const categories = data.map(d => d.category);
  const values = data.map(d => d.value);

  // Band scale for categories
  const xScale = createScale('band')
    .domain(categories)
    .range([50, 550])
    .padding(0.2);  // Space between bars

  // Linear scale for values
  const yScale = createScale('linear')
    .domain([0, Math.max(...values)])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Bar {data} x="category" y="value" fill="#48bb78" />
  <Axis scale={xScale} type="x" position="bottom" />
  <Axis scale={yScale} type="y" position="left" gridLines />
</Chart>
```

### Grouped Categories

```svelte
<script>
  const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
  const subCategories = ['Product A', 'Product B'];

  // Outer scale for quarters
  const xScale = createScale('band')
    .domain(categories)
    .range([50, 550])
    .padding(0.2);

  // Inner scale for products within each quarter
  const subScale = createScale('band')
    .domain(subCategories)
    .range([0, xScale.bandwidth()])
    .padding(0.05);
</script>
```

## Time Scales

### Date Formatting

```svelte
<script>
  import { createScale } from '@thomasfosterau/charts';

  const data = [
    { date: new Date('2024-01-01'), value: 100 },
    { date: new Date('2024-06-01'), value: 150 },
    { date: new Date('2024-12-31'), value: 200 }
  ];

  const xScale = createScale('time')
    .domain([data[0].date, data[data.length - 1].date])
    .range([50, 550]);

  // Custom tick formatter
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      year: 'numeric'
    });
  };
</script>

<Axis 
  scale={xScale} 
  type="x" 
  position="bottom"
  tickFormat={formatDate}
/>
```

### Time Intervals

```javascript
// Create scale with specific intervals
const xScale = createScale('time')
  .domain([new Date('2024-01-01'), new Date('2024-12-31')])
  .range([50, 550]);

// D3 time intervals can be used for ticks
import { timeMonth } from 'd3-time';
const ticks = xScale.ticks(timeMonth.every(1));
```

## Multi-Scale Charts

### Dual Y-Axes

```svelte
<script>
  const temperature = [20, 22, 25, 23, 21];
  const humidity = [60, 65, 70, 68, 62];

  const tempScale = createScale('linear')
    .domain([15, 30])
    .range([360, 40]);

  const humidityScale = createScale('linear')
    .domain([50, 80])
    .range([360, 40]);
</script>

<Chart width={600} height={400}>
  <Line data={tempData} x="x" y="y" stroke="#e53e3e" />
  <Line data={humidityData} x="x" y="y" stroke="#4299e1" />
  
  <Axis scale={tempScale} type="y" position="left" label="Temperature (°C)" />
  <Axis scale={humidityScale} type="y" position="right" label="Humidity (%)" />
</Chart>
```

## Common Patterns

### Zero Baseline

Include zero in the domain for better context:

```javascript
const yScale = createScale('linear')
  .domain([0, Math.max(...values)])  // Start at 0
  .range([360, 40]);
```

### Symmetric Domain

Center the scale around zero:

```javascript
const maxAbsValue = Math.max(...values.map(Math.abs));

const yScale = createScale('linear')
  .domain([-maxAbsValue, maxAbsValue])
  .range([360, 40]);
```

### Clamping

Prevent values outside domain:

```javascript
const scale = createScale('linear')
  .domain([0, 100])
  .range([0, 600])
  .clamp(true);  // Values outside [0,100] are clamped

scale(-10);  // Returns 0 (clamped)
scale(150);  // Returns 600 (clamped)
```

### Custom Interpolation

For color scales or custom mappings:

```javascript
import { interpolateRgb } from 'd3-interpolate';

const colorScale = createScale('linear')
  .domain([0, 100])
  .range(['#4299e1', '#e53e3e'])
  .interpolate(interpolateRgb);

const color = colorScale(50);  // Returns middle color
```

## Troubleshooting

### Data Not Showing

**Problem**: Chart appears empty

**Check**:
1. Domain includes all data values
2. Range matches chart dimensions
3. For y-axis, range is inverted `[bottom, top]`

```javascript
// ❌ Wrong: y range not inverted
const yScale = createScale('linear')
  .domain([0, 100])
  .range([40, 360]);

// ✅ Correct: high values at top
const yScale = createScale('linear')
  .domain([0, 100])
  .range([360, 40]);
```

### Scale Type Mismatch

**Problem**: Using wrong scale type for data

**Solution**: Match scale to data type:
- Continuous numbers → `linear`, `log`, `pow`, `sqrt`
- Dates/times → `time`
- Categories → `band`, `ordinal`, `point`

### Tick Issues

**Problem**: Too many or too few ticks

**Solution**: Use tickCount prop:

```svelte
<Axis scale={yScale} type="y" position="left" tickCount={5} />
```

## Best Practices

1. **Always include context**: Use padding or include zero when appropriate
2. **Match scale to data**: Continuous scales for numbers, discrete for categories
3. **Invert y-axis range**: Visual y increases downward in SVG
4. **Use getNiceDomain**: For automatic, pleasing ranges
5. **Document your scales**: Comment unusual domain/range choices

## Further Reading

- [D3 Scales Documentation](https://github.com/d3/d3-scale)
- [D3 Time Scales](https://github.com/d3/d3-time)
- [Tutorial: Advanced Features](../tutorials/02-advanced-features.md)
