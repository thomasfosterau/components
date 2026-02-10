# Library Comparisons

This document provides detailed comparisons between `@thomasfosterau/charts` and the libraries that inspired it, helping you understand the design choices and trade-offs.

## Libraries That Inspired This Project

### 1. Swift Charts (Apple)
### 2. D3.js
### 3. Pancake Charts (Rich Harris)
### 4. Chart.js
### 5. Observable Plot

## Quick Comparison Table

| Feature | @thomasfosterau/charts | Swift Charts | D3.js | Chart.js | Recharts | Observable Plot |
|---------|------------------------|--------------|-------|----------|----------|-----------------|
| **Framework** | Svelte | SwiftUI | Vanilla JS | Vanilla JS | React | Vanilla JS |
| **Declarative API** | ✅ Full | ✅ Full | ❌ Imperative | ⚠️ Config | ✅ Full | ✅ Full |
| **SSR Support** | ✅ Yes | N/A | ⚠️ Limited | ❌ No | ✅ Yes | ⚠️ Limited |
| **TypeScript** | ✅ Native | N/A | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Canvas Support** | ✅ Yes | N/A | ✅ Manual | ✅ Yes | ❌ No | ❌ No |
| **WebGPU Support** | ✅ Yes | N/A | ❌ No | ❌ No | ❌ No | ❌ No |
| **Multi-renderer** | ✅ Yes | N/A | ⚠️ Manual | ⚠️ Limited | ❌ SVG only | ❌ SVG only |
| **Bundle Size** | Small (~70KB) | N/A | Large (~240KB) | Medium (~170KB) | Large (~200KB) | Medium (~150KB) |
| **Learning Curve** | Low | Low | High | Low | Medium | Medium |
| **Customization** | High | Medium | Very High | Medium | High | High |
| **Animation** | 🚧 Planned | ✅ Built-in | ✅ Powerful | ✅ Built-in | ✅ Built-in | ❌ Limited |
| **Interactivity** | 🚧 Planned | ✅ Built-in | ✅ Powerful | ✅ Built-in | ✅ Built-in | ⚠️ Basic |

## Detailed Comparisons

## 1. Swift Charts

**What it is:** Apple's declarative charting framework for SwiftUI apps

**What we learned:**
- Declarative API design
- Mark-based composition
- Scale system integration
- Type-safe chart building

### API Comparison

**Swift Charts:**
```swift
Chart(data) {
  LineMark(
    x: .value("Date", $0.date),
    y: .value("Sales", $0.sales)
  )
  .foregroundStyle(.blue)
}
```

**Our Library:**
```svelte
<Chart>
  <Line 
    data={data} 
    x="date" 
    y="sales"
    stroke="blue" />
</Chart>
```

### Similarities

1. **Declarative Syntax**: Both use declarative component composition
2. **Type Safety**: Strong typing throughout
3. **Scale System**: Automatic scale inference with manual overrides
4. **Composability**: Charts built from composable marks

### Differences

| Aspect | Swift Charts | Our Library |
|--------|--------------|-------------|
| **Platform** | iOS/macOS only | Web (all browsers) |
| **Language** | Swift | TypeScript/JavaScript |
| **Rendering** | Native graphics | SVG/Canvas/WebGPU |
| **Animation** | Built-in with SwiftUI | Planned feature |
| **Gestures** | Built-in touch/pointer | Planned feature |

### Why Not Just Copy Swift Charts?

1. **Web Platform**: Different constraints and capabilities
2. **Rendering Options**: Web has multiple targets (SVG, Canvas, GPU)
3. **Existing Ecosystem**: Need to integrate with D3, Svelte, etc.
4. **SSR**: Web needs server-side rendering support

### What We Adopted

✅ Declarative component API
✅ Mark-based abstraction (Line, Bar, etc.)
✅ Clean prop-based configuration
✅ Compositional design

### What We Modified

🔄 Multi-renderer support (not needed on iOS)
🔄 Pancake coordinates (for SSR compatibility)
🔄 Integration with D3 scales
🔄 Svelte reactivity instead of SwiftUI's @State

## 2. D3.js

**What it is:** Data-Driven Documents - The industry standard visualization library

**What we learned:**
- Scale system
- Data transformation patterns
- Shape generators
- Selection and binding concepts

### API Comparison

**D3.js:**
```javascript
const svg = d3.select("svg");

const xScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 600]);

svg.selectAll("circle")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", d => xScale(d.x))
  .attr("cy", d => yScale(d.y))
  .attr("r", 5);
```

**Our Library:**
```svelte
<script>
  const xScale = createScale('linear')
    .domain([0, 100])
    .range([0, 600]);
</script>

<Chart>
  <Scatter data={data} x="x" y="y" radius={5} />
</Chart>
```

### Similarities

1. **Scale System**: We use D3's scale functions directly
2. **Data-Driven**: Both are fundamentally data-driven
3. **Flexibility**: High degree of customization
4. **Shape Generators**: Similar line/area generators

### Differences

| Aspect | D3.js | Our Library |
|--------|-------|-------------|
| **Paradigm** | Imperative | Declarative |
| **DOM Manipulation** | Direct (selection) | Abstracted (components) |
| **Framework** | Vanilla JS | Svelte |
| **Rendering** | Primarily SVG | SVG/Canvas/WebGPU |
| **SSR** | Difficult | Native support |
| **Learning Curve** | Steep | Gentle |

### Why Not Just Use D3?

**D3's Strengths:**
- Incredibly powerful and flexible
- Industry standard
- Vast ecosystem
- Excellent documentation

**D3's Weaknesses for Our Use Case:**
- Imperative API (lots of manual work)
- Not SSR-friendly out of the box
- No built-in Canvas/WebGPU rendering
- Steep learning curve for beginners
- Direct DOM manipulation (not reactive)

### What We Adopted

✅ Scale system (d3-scale)
✅ Shape generators (d3-shape)
✅ Data transformation patterns
✅ Time handling (d3-time)
✅ Array utilities (d3-array)

### What We Changed

🔄 Wrapped in declarative components
🔄 Svelte reactivity instead of manual updates
🔄 Abstracted rendering layer
🔄 SSR-compatible by default

### Integration Example

You can still use D3 utilities directly:

```svelte
<script>
  import { scaleTime } from 'd3-scale';
  import { extent } from 'd3-array';
  import { Line } from '@thomasfosterau/charts';
  
  // Use D3 directly
  const xScale = scaleTime()
    .domain(extent(data, d => d.date))
    .range([0, 600]);
</script>

<Chart>
  <Line data={data} x="date" y="value" xScale={xScale} />
</Chart>
```

## 3. Pancake Charts

**What it is:** Rich Harris's SSR-compatible charting library for Svelte

**What we learned:**
- Percentage-based coordinates
- SSR compatibility patterns
- Svelte component composition
- Renderer independence

### API Comparison

**Pancake Charts:**
```svelte
<script>
  import * as Pancake from '@sveltejs/pancake';
</script>

<Pancake.Chart>
  <Pancake.Grid horizontal count={5} />
  <Pancake.SVG>
    <Pancake.SvgLine data={data} x={d => d.x} y={d => d.y} />
  </Pancake.SVG>
</Pancake.Chart>
```

**Our Library:**
```svelte
<Chart renderTarget="svg">
  <Grid type="horizontal" count={5} />
  <Line data={data} x="x" y="y" />
</Chart>
```

### Similarities

1. **Pancake Coordinates**: Both use 0-100 percentage system
2. **SSR Support**: Native server-side rendering
3. **Svelte Native**: Built specifically for Svelte
4. **Component-Based**: Declarative component API

### Differences

| Aspect | Pancake Charts | Our Library |
|--------|----------------|-------------|
| **Scope** | Layout library | Full charting library |
| **Rendering** | You implement | Built-in renderers |
| **Chart Types** | DIY | Pre-built components |
| **Scales** | Manual | Integrated D3 scales |
| **Canvas Support** | No | Yes |
| **WebGPU Support** | No | Yes |
| **Theming** | Manual | Built-in theme system |

### Why Not Just Use Pancake?

**Pancake's Strengths:**
- Minimal and focused
- Perfect for custom visualizations
- SSR-compatible
- Lightweight

**Pancake's Limitations:**
- Layout only, not a full charting library
- No pre-built chart types
- No scale system
- No rendering abstraction
- Manual implementation required

### What We Adopted

✅ Pancake coordinate system (0-100)
✅ SSR compatibility approach
✅ Svelte-first design
✅ Component composition patterns

### What We Extended

➕ Full renderer abstraction (SVG/Canvas/WebGPU)
➕ Pre-built chart components
➕ Integrated scale system
➕ Theme system
➕ More chart types

### Relationship

We built a complete charting library **on top of** Pancake's core concept. Think of it as:
- **Pancake**: The coordinate system idea
- **Our library**: Complete charting solution using that system

## 4. Chart.js

**What it is:** Popular, simple charting library with Canvas rendering

**What we learned:**
- Simple, approachable API
- Canvas performance optimization
- Plugin architecture
- Configuration-based design

### API Comparison

**Chart.js:**
```javascript
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Sales',
      data: [10, 20, 15],
      borderColor: 'blue'
    }]
  },
  options: {
    responsive: true
  }
});
```

**Our Library:**
```svelte
<Chart renderTarget="canvas">
  <Line 
    data={salesData} 
    x="month" 
    y="sales"
    stroke="blue" />
</Chart>
```

### Similarities

1. **Ease of Use**: Both prioritize developer experience
2. **Canvas Rendering**: Both support high-performance Canvas
3. **Multiple Chart Types**: Pre-built chart components
4. **Configuration**: Props/options for customization

### Differences

| Aspect | Chart.js | Our Library |
|--------|----------|-------------|
| **API Style** | Configuration object | Declarative components |
| **Framework** | Framework-agnostic | Svelte-specific |
| **SSR** | No | Yes |
| **Multi-renderer** | Canvas only (+ plugins) | SVG/Canvas/WebGPU built-in |
| **Reactivity** | Manual updates | Automatic (Svelte) |
| **TypeScript** | Types available | Native TypeScript |

### Why Not Just Use Chart.js?

**Chart.js Strengths:**
- Very popular (huge community)
- Excellent documentation
- Many plugins
- Simple for basic charts

**Chart.js Limitations:**
- Configuration-heavy (not declarative)
- No SSR support
- Canvas-focused (SVG harder)
- Manual updates (not reactive)
- Not Svelte-native

### What We Adopted

✅ Simple, approachable API
✅ Canvas performance focus
✅ Multiple chart types
✅ Sensible defaults

### What We Improved

🔄 Declarative instead of configuration
🔄 SSR support
🔄 Multi-renderer architecture
🔄 Native Svelte reactivity
🔄 TypeScript-first design

## 5. Observable Plot

**What it is:** Observable's successor to D3, with a grammar of graphics approach

**What we learned:**
- Grammar of graphics patterns
- Mark-based API
- Declarative transformations
- Concise syntax

### API Comparison

**Observable Plot:**
```javascript
Plot.plot({
  marks: [
    Plot.line(data, {
      x: "date",
      y: "value",
      stroke: "blue"
    })
  ]
});
```

**Our Library:**
```svelte
<Chart>
  <Line data={data} x="date" y="value" stroke="blue" />
</Chart>
```

### Similarities

1. **Declarative**: Both use declarative specifications
2. **Grammar of Graphics**: Mark-based composition
3. **Concise**: Minimal boilerplate
4. **Type Safety**: Strong TypeScript support

### Differences

| Aspect | Observable Plot | Our Library |
|--------|-----------------|-------------|
| **Framework** | Vanilla JS | Svelte |
| **Target** | Observable notebooks | Web applications |
| **Rendering** | SVG only | SVG/Canvas/WebGPU |
| **Reactivity** | Functional updates | Svelte reactivity |
| **SSR** | Limited | Full support |
| **Component Model** | Functional | Component-based |

### What We Adopted

✅ Mark-based API design
✅ Declarative transformations
✅ Concise syntax
✅ Grammar of graphics thinking

### What We Changed

🔄 Component-based instead of functional
🔄 Svelte framework integration
🔄 Multi-renderer support
🔄 Full SSR compatibility

## Unique Features of Our Library

What makes `@thomasfosterau/charts` different:

### 1. Multi-Renderer Architecture

**First class support for multiple render targets:**

```svelte
<!-- Same component, different renderers -->
<Chart renderTarget="svg">     <!-- SSR, accessibility -->
<Chart renderTarget="canvas">  <!-- Performance -->
<Chart renderTarget="webgpu">  <!-- GPU acceleration -->
```

**No other library offers this flexibility:**
- Chart.js: Canvas only
- Recharts: SVG only
- D3: Primarily SVG, manual Canvas
- Observable Plot: SVG only

### 2. Pancake Coordinate System

**Percentage-based coordinates for true renderer independence:**

```typescript
// Same coordinate works everywhere
const point = { x: 50, y: 50 };

// SVG: 50% of container
// Canvas: 50% of canvas
// WebGPU: Converts to normalized device coords
```

**Other libraries:**
- D3: Pixel-based
- Chart.js: Pixel-based with scaling
- Pancake: Layout only, no rendering

### 3. Svelte-Native with SSR

**Built specifically for Svelte, fully SSR-compatible:**

```svelte
<!-- Works in SvelteKit SSR -->
<Chart renderTarget="svg">
  <Line data={data} x="x" y="y" />
</Chart>
```

**Other Svelte options:**
- Pancake: Layout only
- Layer Cake: Good but different approach
- Using D3 directly: Not SSR-friendly

### 4. TypeScript-First

**Native TypeScript, not an afterthought:**

```typescript
interface DataPoint {
  x: number;
  y: number;
}

// Full type inference
<Line data={data} x="x" y="y" />  // Types are inferred
```

### 5. Modern Web Platform

**Leverages latest web standards:**

- WebGPU for GPU acceleration
- ES modules
- Modern browser APIs
- Standard web components

## Migration Guides

### From D3.js

**Before (D3):**
```javascript
const svg = d3.select("svg");
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y));

svg.append("path")
  .datum(data)
  .attr("d", line)
  .attr("stroke", "blue");
```

**After (Our Library):**
```svelte
<Chart>
  <Line data={data} x="x" y="y" stroke="blue" />
</Chart>
```

**Key differences:**
- No manual DOM manipulation
- Automatic reactivity
- Multi-renderer support
- SSR-compatible

### From Chart.js

**Before (Chart.js):**
```javascript
new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [{
      data: data,
      borderColor: 'blue'
    }]
  }
});
```

**After (Our Library):**
```svelte
<Chart renderTarget="canvas">
  <Line data={data} x="x" y="y" stroke="blue" />
</Chart>
```

**Key differences:**
- Component-based, not configuration
- Svelte reactivity
- SSR support
- Multiple renderers

### From Recharts (React)

**Before (Recharts):**
```jsx
<ResponsiveContainer>
  <LineChart data={data}>
    <Line dataKey="y" stroke="blue" />
    <XAxis dataKey="x" />
  </LineChart>
</ResponsiveContainer>
```

**After (Our Library):**
```svelte
<Chart>
  <Line data={data} x="x" y="y" stroke="blue" />
  <Axis scale={xScale} type="x" />
</Chart>
```

**Key differences:**
- Svelte instead of React
- Multi-renderer support
- More explicit control

## When to Use Each Library

### Use D3.js when:
- ✅ You need maximum flexibility
- ✅ Building highly custom visualizations
- ✅ You're comfortable with imperative programming
- ✅ You need the full D3 ecosystem

### Use Chart.js when:
- ✅ You need framework-agnostic charts
- ✅ Building standard chart types
- ✅ You prefer configuration over code
- ✅ Canvas performance is priority

### Use Recharts when:
- ✅ You're building a React app
- ✅ You want declarative React components
- ✅ Standard chart types are sufficient
- ✅ SVG rendering is acceptable

### Use Observable Plot when:
- ✅ Working in Observable notebooks
- ✅ You love grammar of graphics
- ✅ Need concise specifications
- ✅ SVG-only is fine

### Use Our Library when:
- ✅ Building a Svelte application
- ✅ SSR is required
- ✅ Need multiple render targets
- ✅ Want declarative + performant
- ✅ TypeScript is important
- ✅ Building custom visualizations

## Conclusion

`@thomasfosterau/charts` synthesizes the best ideas from:
- **Swift Charts**: Declarative API
- **D3.js**: Scale system and data transformation
- **Pancake**: Coordinate system for SSR
- **Chart.js**: Ease of use and Canvas performance
- **Observable Plot**: Grammar of graphics

While adding unique features:
- **Multi-renderer architecture**
- **True SSR compatibility**
- **Svelte-native design**
- **TypeScript-first approach**
- **Modern web platform integration**

The result is a library that's both powerful and approachable, declarative yet performant, and built specifically for modern Svelte applications.
