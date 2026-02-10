# Guide: Server-Side Rendering (SSR)

Learn how to use @thomasfosterau/charts with SvelteKit and server-side rendering.

## Overview

@thomasfosterau/charts is designed with SSR in mind. The SVG renderer works perfectly on the server without any browser APIs, making it ideal for:

- SvelteKit applications
- Static site generation (SSG)
- Pre-rendered pages
- SEO-friendly charts

## Why SSR for Charts?

### Benefits

✅ **Better Performance**: Charts render on the server, users see them immediately  
✅ **SEO Friendly**: Search engines can index chart content  
✅ **No Loading States**: Charts appear on first paint  
✅ **Works Without JS**: Charts display even if JavaScript fails  
✅ **Accessible**: SVG markup is semantic and screen-reader friendly

### When to Use SSR

- Blog posts with data visualizations
- Dashboard landing pages
- Reports and analytics pages
- Marketing pages with charts
- Documentation with examples

## Basic SSR Setup

### SvelteKit Page Component

```svelte
<!-- +page.svelte -->
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

**Important**: Always use `renderTarget="svg"` for SSR. Canvas and WebGPU require browser APIs.

## Loading Data on the Server

### Using +page.server.js

Fetch data on the server and pass it to your component:

```javascript
// +page.server.js
export async function load({ fetch }) {
  const response = await fetch('/api/chart-data');
  const data = await response.json();

  return {
    chartData: data
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  
  export let data;
  
  $: chartData = data.chartData;
</script>

<Chart width={600} height={400} renderTarget="svg">
  <Line data={chartData} x="x" y="y" stroke="#4299e1" />
</Chart>
```

### Using +page.js with Universal Load

For data that can be loaded on both server and client:

```javascript
// +page.js
export async function load({ fetch }) {
  const response = await fetch('https://api.example.com/data');
  const chartData = await response.json();

  return {
    chartData
  };
}
```

## Static Site Generation (SSG)

### Prerendering Pages

Enable prerendering to generate static HTML at build time:

```javascript
// +page.js
export const prerender = true;
```

```svelte
<!-- +page.svelte -->
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  // Data is baked into the HTML at build time
  const data = [/* ... */];
</script>

<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

### Generating Multiple Pages

```javascript
// +page.server.js
export const prerender = true;

export async function entries() {
  // Generate a page for each chart
  return [
    { id: 'revenue' },
    { id: 'users' },
    { id: 'growth' }
  ];
}

export async function load({ params }) {
  const { id } = params;
  
  // Fetch data for this specific chart
  const data = await fetchChartData(id);
  
  return { data };
}
```

## Handling Client-Side Interactions

### Progressive Enhancement

Start with SSR chart, add interactions on the client:

```svelte
<script>
  import { onMount } from 'svelte';
  import { Chart, Line } from '@thomasfosterau/charts';

  export let data;
  
  let renderTarget = 'svg';
  let interactive = false;

  onMount(() => {
    // Switch to canvas for better performance on client
    renderTarget = 'canvas';
    interactive = true;
  });

  function handleHover(event) {
    if (!interactive) return;
    // Handle hover interaction
  }
</script>

<div on:mousemove={handleHover}>
  <Chart width={600} height={400} {renderTarget}>
    <Line {data} x="x" y="y" stroke="#4299e1" />
  </Chart>
</div>
```

### Hybrid Approach

Render static SVG on server, enhance with Canvas on client for large datasets:

```svelte
<script>
  import { browser } from '$app/environment';
  import { Chart, Line } from '@thomasfosterau/charts';

  export let data;

  // Use SVG for SSR, Canvas on client if dataset is large
  $: renderTarget = browser && data.length > 1000 ? 'canvas' : 'svg';
</script>

<Chart width={600} height={400} {renderTarget}>
  <Line {data} x="x" y="y" stroke="#4299e1" />
</Chart>
```

## SEO Optimization

### Adding Metadata

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  export let data;
  
  const chartTitle = 'Revenue Growth 2024';
  const chartDescription = 'Monthly revenue showing 35% growth year-over-year';
</script>

<svelte:head>
  <title>{chartTitle}</title>
  <meta name="description" content={chartDescription} />
  <meta property="og:title" content={chartTitle} />
  <meta property="og:description" content={chartDescription} />
</svelte:head>

<h1>{chartTitle}</h1>
<p>{chartDescription}</p>

<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="month" y="revenue" stroke="#48bb78" />
</Chart>
```

### Structured Data

Add structured data for search engines:

```svelte
<script>
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Monthly Revenue Data",
    "description": "Revenue trends for 2024",
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "/api/data/revenue.json"
    }
  };
</script>

<svelte:head>
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</svelte:head>
```

## Accessibility in SSR

### ARIA Labels

Make your charts accessible:

```svelte
<div role="img" aria-label="Line chart showing revenue growth from January to December 2024">
  <Chart width={600} height={400} renderTarget="svg">
    <Line {data} x="month" y="revenue" />
  </Chart>
</div>

<!-- Provide data table alternative -->
<details>
  <summary>View data table</summary>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Revenue</th>
      </tr>
    </thead>
    <tbody>
      {#each data as row}
        <tr>
          <td>{row.month}</td>
          <td>${row.revenue}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</details>
```

### Screen Reader Text

```svelte
<div class="chart-container">
  <span class="sr-only">
    Chart showing revenue growth from $10,000 in January to $35,000 in December,
    representing a 250% increase.
  </span>
  
  <Chart width={600} height={400} renderTarget="svg">
    <Line {data} x="month" y="revenue" />
  </Chart>
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

## Performance Optimization

### Code Splitting

Only load chart library on pages that need it:

```javascript
// +page.js
export async function load() {
  // Dynamically import chart components
  const { Chart, Line } = await import('@thomasfosterau/charts');
  
  return {
    Chart,
    Line,
    data: await fetchData()
  };
}
```

### Lazy Loading Charts

Load charts below the fold lazily:

```svelte
<script>
  import { onMount } from 'svelte';
  
  let visible = false;
  let Chart, Line;

  onMount(async () => {
    // Use Intersection Observer to detect when chart enters viewport
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadChart();
        observer.disconnect();
      }
    });

    observer.observe(chartContainer);
  });

  async function loadChart() {
    const charts = await import('@thomasfosterau/charts');
    Chart = charts.Chart;
    Line = charts.Line;
    visible = true;
  }

  let chartContainer;
</script>

<div bind:this={chartContainer}>
  {#if visible && Chart}
    <Chart width={600} height={400}>
      <Line {data} x="x" y="y" />
    </Chart>
  {:else}
    <div style="width: 600px; height: 400px; background: #f0f0f0;">
      Loading chart...
    </div>
  {/if}
</div>
```

## Caching Strategies

### Page Caching

Cache server-rendered pages:

```javascript
// +page.server.js
export async function load({ setHeaders }) {
  const data = await fetchData();

  // Cache for 1 hour
  setHeaders({
    'Cache-Control': 'public, max-age=3600'
  });

  return { data };
}
```

### Data Caching

Cache expensive data queries:

```javascript
// src/lib/cache.js
const cache = new Map();

export async function getCachedData(key, fetcher, ttl = 3600000) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

```javascript
// +page.server.js
import { getCachedData } from '$lib/cache';

export async function load() {
  const data = await getCachedData(
    'chart-revenue-2024',
    () => fetchRevenueData(),
    3600000 // 1 hour
  );

  return { data };
}
```

## Error Handling

### Graceful Degradation

Handle missing data gracefully:

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  export let data;
  
  $: hasData = data && data.chartData && data.chartData.length > 0;
</script>

{#if hasData}
  <Chart width={600} height={400} renderTarget="svg">
    <Line data={data.chartData} x="x" y="y" stroke="#4299e1" />
  </Chart>
{:else if data?.error}
  <div class="error">
    <p>Unable to load chart data: {data.error}</p>
  </div>
{:else}
  <div class="no-data">
    <p>No data available</p>
  </div>
{/if}
```

### Error Boundaries

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  export let data;
  
  let error = null;

  function handleError(e) {
    console.error('Chart error:', e);
    error = e.message;
  }
</script>

{#if error}
  <div class="error">Chart failed to render: {error}</div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div on:error={handleError}>
    <Chart width={600} height={400} renderTarget="svg">
      <Line {data} x="x" y="y" />
    </Chart>
  </div>
{/if}
```

## Testing SSR

### Unit Tests

Test components in SSR mode:

```javascript
// chart.test.js
import { render } from '@testing-library/svelte';
import ChartComponent from './ChartComponent.svelte';

test('renders chart on server', () => {
  const { container } = render(ChartComponent, {
    props: {
      data: [{ x: 0, y: 10 }, { x: 1, y: 20 }]
    }
  });

  // Check that SVG is rendered
  const svg = container.querySelector('svg');
  expect(svg).toBeInTheDocument();
});
```

### Integration Tests

Test full page rendering:

```javascript
// +page.test.js
import { render } from '@testing-library/svelte';
import Page from './+page.svelte';

test('page renders with chart data', async () => {
  const mockData = {
    chartData: [{ x: 0, y: 10 }, { x: 1, y: 20 }]
  };

  const { getByRole } = render(Page, {
    props: { data: mockData }
  });

  expect(getByRole('img')).toBeInTheDocument();
});
```

## Common Pitfalls

### ❌ Using Canvas/WebGPU for SSR

```svelte
<!-- DON'T: Canvas doesn't work on server -->
<Chart renderTarget="canvas">
  <Line {data} x="x" y="y" />
</Chart>
```

### ✅ Use SVG for SSR

```svelte
<!-- DO: SVG works everywhere -->
<Chart renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

### ❌ Accessing Browser APIs Directly

```svelte
<script>
  // DON'T: window is undefined on server
  const width = window.innerWidth;
</script>
```

### ✅ Check for Browser Context

```svelte
<script>
  import { browser } from '$app/environment';

  // DO: Check if in browser
  const width = browser ? window.innerWidth : 600;
</script>
```

## Best Practices

1. **Always use SVG for SSR** - Canvas and WebGPU require browser APIs
2. **Fetch data on server** - Use load functions for data fetching
3. **Enable prerendering** - Use static site generation when possible
4. **Provide fallbacks** - Handle missing data and errors gracefully
5. **Add accessibility** - Include ARIA labels and data tables
6. **Cache aggressively** - Cache both pages and data
7. **Test SSR** - Ensure charts render correctly on the server

## Further Reading

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Guide: Render Targets](./render-targets.md)
- [Tutorial: Getting Started](../getting-started.md)
