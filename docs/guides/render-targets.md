# Guide: Render Targets

This guide explains the three rendering backends available in @thomasfosterau/charts and when to use each one.

## Overview

@thomasfosterau/charts supports three render targets:

1. **SVG** - Server-side rendering compatible, best for static charts
2. **Canvas** - High-performance client-side rendering for dynamic charts
3. **WebGPU** - GPU-accelerated rendering for complex visualizations (experimental)

All render targets use the same Pancake coordinate system, so your chart code works unchanged across all three.

## SVG Rendering

### What is SVG?

SVG (Scalable Vector Graphics) is a XML-based vector image format that renders as DOM elements.

### When to Use SVG

✅ **Use SVG when:**
- Server-side rendering (SSR) with SvelteKit
- You need accessible, semantic markup
- Exporting charts as static images
- Small to medium datasets (<1000 points)
- You need crisp rendering at any zoom level
- SEO is important (searchable text in charts)

❌ **Avoid SVG when:**
- Rendering very large datasets (>1000 points)
- You need real-time animations
- Performance is critical

### Usage

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  
  const data = [/* your data */];
</script>

<!-- SVG is the default -->
<Chart width={600} height={400}>
  <Line {data} x="x" y="y" />
</Chart>

<!-- Or explicitly specify -->
<Chart width={600} height={400} renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

### SVG Benefits

- **SSR Compatible**: Renders on the server without browser APIs
- **Accessibility**: Screen readers can access SVG elements
- **Crisp at Any Scale**: Vector format stays sharp at any zoom
- **CSS Styling**: Style elements with CSS
- **Easy Inspection**: View chart structure in browser DevTools

### SVG Limitations

- **Performance**: Slower with large datasets due to DOM overhead
- **Memory**: Each element consumes memory
- **Animation**: DOM updates can be expensive

## Canvas Rendering

### What is Canvas?

Canvas is a bitmap-based rendering API that draws to a single `<canvas>` element using JavaScript.

### When to Use Canvas

✅ **Use Canvas when:**
- Large datasets (>1000 points)
- Real-time data streaming
- Smooth animations
- Performance is critical
- Client-side only rendering

❌ **Avoid Canvas when:**
- Server-side rendering is required
- You need accessibility features
- You want to inspect individual elements
- Exporting to vector formats

### Usage

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  
  const largeDataset = [/* thousands of points */];
</script>

<Chart width={800} height={600} renderTarget="canvas">
  <Line data={largeDataset} x="x" y="y" stroke="#4299e1" />
</Chart>
```

### Canvas Benefits

- **High Performance**: Handles large datasets efficiently
- **Low Memory**: Single canvas element regardless of data size
- **Smooth Animation**: Direct pixel manipulation
- **No DOM Overhead**: Faster rendering and updates

### Canvas Limitations

- **No SSR**: Requires browser Canvas API
- **Less Accessible**: Canvas content is not semantic HTML
- **Fixed Resolution**: Bitmap that can look blurry when scaled
- **No Element Inspection**: Can't inspect individual chart elements

### Performance Comparison

| Data Points | SVG Time | Canvas Time | Speedup |
|-------------|----------|-------------|---------|
| 100         | 10ms     | 5ms         | 2x      |
| 1,000       | 100ms    | 15ms        | 6.7x    |
| 10,000      | 1000ms   | 50ms        | 20x     |
| 100,000     | 10000ms  | 200ms       | 50x     |

## WebGPU Rendering

### What is WebGPU?

WebGPU is a modern graphics API that provides low-level access to GPU hardware for compute and rendering.

### When to Use WebGPU

✅ **Use WebGPU when:**
- Extremely large datasets (>100,000 points)
- Complex visualizations requiring GPU compute
- Real-time 3D visualizations
- Advanced shader effects

❌ **Avoid WebGPU when:**
- Browser support is a concern (currently limited)
- Simple charts that don't need GPU acceleration
- Server-side rendering is required

### Usage

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  
  const massiveDataset = [/* hundreds of thousands of points */];
</script>

<Chart width={1200} height={800} renderTarget="webgpu">
  <Line data={massiveDataset} x="x" y="y" stroke="#4299e1" />
</Chart>
```

### WebGPU Benefits

- **Maximum Performance**: GPU-accelerated rendering
- **Massive Datasets**: Handle millions of points
- **Advanced Effects**: Custom shaders and compute
- **Future-Proof**: Modern GPU API

### WebGPU Limitations

- **Browser Support**: Limited to modern browsers (Chrome 113+, Edge 113+)
- **Experimental**: API still evolving
- **Complexity**: More complex error handling
- **No SSR**: Requires WebGPU-capable device

### Browser Support

As of 2024:
- ✅ Chrome/Edge 113+
- ✅ Safari 18+ (macOS 14+)
- ❌ Firefox (in development)
- ❌ Mobile browsers (limited)

Check support:
```javascript
const hasWebGPU = 'gpu' in navigator;
```

## Choosing the Right Render Target

### Decision Tree

```
Do you need SSR?
├─ Yes → Use SVG
└─ No → How many data points?
    ├─ < 1,000 → Use SVG (better accessibility)
    ├─ 1,000 - 10,000 → Use Canvas (better performance)
    └─ > 10,000 → Use Canvas or WebGPU
        ├─ WebGPU supported? → Use WebGPU
        └─ Otherwise → Use Canvas
```

### Use Case Examples

#### Static Documentation Site
```svelte
<!-- SSR-friendly, accessible -->
<Chart renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

#### Real-time Dashboard
```svelte
<!-- High performance, frequent updates -->
<Chart renderTarget="canvas">
  <Line {data} x="timestamp" y="value" />
</Chart>
```

#### Financial Charts
```svelte
<!-- Large historical data -->
<Chart renderTarget="canvas">
  <Line data={historicalPrices} x="date" y="price" />
</Chart>
```

#### Scientific Visualization
```svelte
<!-- Massive dataset, GPU acceleration -->
<Chart renderTarget="webgpu">
  <Scatter data={measurements} x="x" y="y" />
</Chart>
```

## Switching Render Targets

You can dynamically switch render targets:

```svelte
<script>
  let renderTarget = 'svg';
  
  function handleDataSizeChange(newSize) {
    if (newSize > 10000) {
      renderTarget = 'canvas';
    } else {
      renderTarget = 'svg';
    }
  }
</script>

<select bind:value={renderTarget}>
  <option value="svg">SVG</option>
  <option value="canvas">Canvas</option>
  <option value="webgpu">WebGPU</option>
</select>

<Chart width={600} height={400} {renderTarget}>
  <Line {data} x="x" y="y" />
</Chart>
```

## Fallback Strategy

Implement graceful fallback for WebGPU:

```svelte
<script>
  import { onMount } from 'svelte';
  
  let renderTarget = 'webgpu';
  
  onMount(() => {
    if (!('gpu' in navigator)) {
      console.log('WebGPU not supported, falling back to Canvas');
      renderTarget = 'canvas';
    }
  });
</script>

<Chart width={600} height={400} {renderTarget}>
  <Line {data} x="x" y="y" />
</Chart>
```

## Rendering Output

### SVG Output

```html
<svg width="600" height="400">
  <path d="M50,360 L150,340 L250,350..." stroke="#4299e1" fill="none"/>
  <g class="axis">
    <line x1="50" y1="40" x2="50" y2="360"/>
    <!-- ... axis ticks and labels -->
  </g>
</svg>
```

### Canvas Output

```html
<canvas width="600" height="400"></canvas>
<!-- Drawing happens via Canvas API in JavaScript -->
```

### WebGPU Output

```html
<canvas width="600" height="400"></canvas>
<!-- Rendering happens via WebGPU API with GPU shaders -->
```

## Best Practices

### 1. Default to SVG for SSR

If your app uses SvelteKit, always use SVG for server-rendered pages:

```svelte
<!-- +page.svelte -->
<Chart renderTarget="svg">
  <Line {data} x="x" y="y" />
</Chart>
```

### 2. Use Canvas for Large Datasets

Switch to Canvas when dealing with substantial data:

```svelte
<script>
  $: renderTarget = data.length > 1000 ? 'canvas' : 'svg';
</script>

<Chart {renderTarget}>
  <Line {data} x="x" y="y" />
</Chart>
```

### 3. Provide Visual Feedback

Let users know when WebGPU isn't available:

```svelte
<script>
  import { onMount } from 'svelte';
  
  let supportsWebGPU = false;
  
  onMount(() => {
    supportsWebGPU = 'gpu' in navigator;
  });
</script>

{#if !supportsWebGPU}
  <div class="warning">
    WebGPU not supported. Using Canvas instead.
  </div>
{/if}
```

### 4. Test Across Render Targets

Ensure your charts work with all three render targets:

```svelte
<!-- Test.svelte -->
<h2>SVG</h2>
<Chart renderTarget="svg"><Line {data} x="x" y="y" /></Chart>

<h2>Canvas</h2>
<Chart renderTarget="canvas"><Line {data} x="x" y="y" /></Chart>

<h2>WebGPU</h2>
<Chart renderTarget="webgpu"><Line {data} x="x" y="y" /></Chart>
```

## Troubleshooting

### Canvas Not Rendering

**Problem**: Canvas appears blank

**Solutions**:
1. Ensure `renderTarget="canvas"` is set
2. Check browser console for errors
3. Verify data is not empty
4. Confirm chart has valid width and height

### WebGPU Errors

**Problem**: "WebGPU not supported" error

**Solutions**:
1. Check browser version (need Chrome/Edge 113+)
2. Ensure GPU drivers are up to date
3. Try in a different browser
4. Implement Canvas fallback

### SVG Performance Issues

**Problem**: SVG chart is slow or laggy

**Solutions**:
1. Reduce dataset size
2. Switch to Canvas rendering
3. Implement data downsampling
4. Use pagination or windowing

## Performance Tips

### Data Downsampling

For large datasets in SVG, downsample the data:

```javascript
function downsample(data, targetSize) {
  if (data.length <= targetSize) return data;
  
  const step = Math.floor(data.length / targetSize);
  return data.filter((_, i) => i % step === 0);
}

const displayData = downsample(largeDataset, 500);
```

### Debounce Updates

Debounce real-time data updates to reduce render frequency:

```svelte
<script>
  import { debounce } from 'lodash-es';
  
  let displayData = [];
  
  const updateData = debounce((newData) => {
    displayData = newData;
  }, 100);
  
  $: updateData(realtimeData);
</script>
```

### Use Request Animation Frame

For animations, use RAF for smooth updates:

```javascript
function animate() {
  updateChartData();
  requestAnimationFrame(animate);
}
```

## Further Reading

- [Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [Guide: SSR Support](./ssr.md)
