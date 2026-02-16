# Design Decisions

This document explains the key design decisions made in building `@thomasfosterau/charts`, including alternative approaches that were considered and why they weren't chosen.

## Table of Contents

1. [Coordinate System](#coordinate-system)
2. [Renderer Architecture](#renderer-architecture)
3. [Framework Choice](#framework-choice)
4. [Scale System](#scale-system)
5. [Component API](#component-api)
6. [TypeScript Strategy](#typescript-strategy)
7. [Build and Distribution](#build-and-distribution)
8. [Testing Approach](#testing-approach)

## Coordinate System

### Decision: Pancake (Percentage-Based) Coordinates

**What we chose:** 0-100 percentage-based coordinate system

**Why:**
1. **SSR Compatibility**: Render charts server-side without knowing pixel dimensions
2. **Renderer Independence**: Same coordinates work for SVG, Canvas, and WebGPU
3. **Responsive by Default**: Percentages scale naturally to any container size
4. **Simpler Mental Model**: Easier to reason about than pixel calculations

### Alternatives Considered

#### 1. Direct Pixel Coordinates

```typescript
// Alternative: Pixel-based
renderer.moveTo({ x: 300, y: 200 }); // In pixels
```

**Pros:**
- More direct, familiar to canvas developers
- No conversion overhead
- Standard approach

**Cons:**
- ❌ Not SSR-compatible (server doesn't know final size)
- ❌ Renderer-dependent (different for SVG, Canvas, WebGPU)
- ❌ Not responsive (hardcoded to specific dimensions)
- ❌ More complex for developers to calculate

**Why rejected:** SSR support was a core requirement, and pixel coordinates make that impossible.

#### 2. Normalized Device Coordinates (-1 to 1)

```typescript
// Alternative: NDC like WebGPU/OpenGL
renderer.moveTo({ x: 0.0, y: 0.0 }); // Center
renderer.moveTo({ x: -1.0, y: 1.0 }); // Top-left
```

**Pros:**
- Standard in 3D graphics
- Natural for WebGPU renderer

**Cons:**
- ❌ Less intuitive for 2D charts
- ❌ Center at (0, 0) is counterintuitive for charts
- ❌ Negative numbers for positions feel wrong
- ❌ Not as developer-friendly

**Why rejected:** While technically sound, 0-100 is more intuitive for chart developers than -1 to 1.

#### 3. SVG ViewBox Approach

```typescript
// Alternative: Use SVG viewBox for everything
<svg viewBox="0 0 100 100">
```

**Pros:**
- Native SVG feature
- Scales well

**Cons:**
- ❌ Only works for SVG renderer
- ❌ Doesn't help with Canvas or WebGPU
- ❌ Still need conversion for non-SVG targets

**Why rejected:** Only solves the problem for one renderer. We needed a truly renderer-agnostic solution.

### Trade-offs of Our Choice

**Benefits:**
- ✅ True SSR compatibility
- ✅ Renderer independence
- ✅ Responsive by default
- ✅ Intuitive (0-100 is familiar)

**Costs:**
- ⚠️ Extra conversion step (minimal performance impact)
- ⚠️ Less direct control over pixels
- ⚠️ New concept for developers to learn

**Verdict:** The benefits far outweigh the costs. Pancake coordinates enable features that would be difficult or impossible with other approaches.

## Renderer Architecture

### Decision: Abstracted Renderer Interface

**What we chose:** Common `Renderer` interface implemented by SVG, Canvas, and WebGPU renderers

**Why:**
1. **Flexibility**: Easy to switch renderers without changing components
2. **Testability**: Can mock renderers for component testing
3. **Extensibility**: New renderers can be added without changing existing code
4. **Performance**: Each renderer optimized for its target

### Alternatives Considered

#### 1. Direct SVG/Canvas in Components

```svelte
<!-- Alternative: Direct rendering in components -->
<script>
  export let data;
  
  // Generate SVG directly
  $: pathData = generateSVGPath(data);
</script>

<svg>
  <path d={pathData} />
</svg>
```

**Pros:**
- Simpler, more direct
- No abstraction layer
- Easier to understand initially

**Cons:**
- ❌ Can't switch renderers
- ❌ Have to duplicate logic for Canvas
- ❌ No WebGPU support
- ❌ Components tightly coupled to rendering

**Why rejected:** We wanted to support multiple render targets, which requires abstraction.

#### 2. Render Props Pattern

```svelte
<!-- Alternative: Render props -->
<Chart>
  {#render children({ renderer, width, height })}
    <Line {data} {renderer} />
  {/render}
</Chart>
```

**Pros:**
- Flexible
- Explicit renderer passing

**Cons:**
- ❌ More verbose
- ❌ Awkward in Svelte (works better in React)
- ❌ Boilerplate for every chart

**Why rejected:** Svelte's context API is cleaner and more idiomatic.

#### 3. Multiple Component Sets

```svelte
<!-- Alternative: Separate components per renderer -->
<SVGChart>
  <SVGLine data={data} />
</SVGChart>

<CanvasChart>
  <CanvasLine data={data} />
</CanvasChart>
```

**Pros:**
- Simple per-renderer
- No abstraction needed

**Cons:**
- ❌ Massive code duplication
- ❌ Harder to maintain
- ❌ Can't switch renderers dynamically
- ❌ Users need to learn multiple APIs

**Why rejected:** Code duplication and maintenance nightmare.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Single API for multiple renderers
- ✅ Easy to test (mock renderer)
- ✅ Can switch renderers dynamically
- ✅ Easy to add new renderers

**Costs:**
- ⚠️ Abstraction layer complexity
- ⚠️ Slight learning curve for contributors
- ⚠️ Can't use renderer-specific features directly

**Verdict:** The abstraction is well worth it. Being able to switch between SVG (SSR), Canvas (performance), and WebGPU (GPU acceleration) with one line change is powerful.

## Framework Choice

### Decision: Svelte-Specific Library

**What we chose:** Build specifically for Svelte, not framework-agnostic

**Why:**
1. **Leverage Svelte Features**: Reactivity, context, component composition
2. **Better DX**: Idiomatic Svelte patterns, not generic solutions
3. **Smaller Bundle**: No framework abstraction overhead
4. **SSR Integration**: Deep integration with SvelteKit SSR

### Alternatives Considered

#### 1. Framework-Agnostic (like Chart.js)

```javascript
// Alternative: Plain JS that works everywhere
const chart = new Charts.Line(document.getElementById('chart'), {
  data: data,
  // ... config
});
```

**Pros:**
- Works in any framework
- Larger potential user base
- Can be used without framework

**Cons:**
- ❌ Can't leverage Svelte's reactivity
- ❌ Manual update management
- ❌ No component composition
- ❌ More imperative API
- ❌ Larger bundle (framework abstraction)

**Why rejected:** We wanted deep Svelte integration, not a generic solution.

#### 2. Multi-Framework (React, Vue, Svelte)

```jsx
// Alternative: Support all major frameworks
// React
<LineChart data={data} />

// Vue
<line-chart :data="data" />

// Svelte
<LineChart {data} />
```

**Pros:**
- Reach all developers
- Larger potential user base

**Cons:**
- ❌ Much more complexity
- ❌ Can't use framework-specific features deeply
- ❌ More code to maintain (3x)
- ❌ Compromises for lowest common denominator

**Why rejected:** Too much complexity for limited benefit. Better to do one thing excellently than three things poorly.

#### 3. Web Components

```html
<!-- Alternative: Web Components -->
<chart-line data="[...]"></chart-line>
```

**Pros:**
- Works everywhere
- Browser standard

**Cons:**
- ❌ Awkward data passing (JSON strings)
- ❌ No framework integration
- ❌ Limited composition
- ❌ SSR is difficult

**Why rejected:** Web Components don't integrate well with modern frameworks. Svelte components are better.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Deep Svelte integration
- ✅ Automatic reactivity
- ✅ Smaller bundle
- ✅ Better DX for Svelte developers
- ✅ Natural SSR support

**Costs:**
- ⚠️ Smaller target audience (Svelte only)
- ⚠️ Can't use in React/Vue apps
- ⚠️ Tied to Svelte's evolution

**Verdict:** Focus on Svelte developers is the right call. Better to be excellent for one community than mediocre for all.

## Scale System

### Decision: Use D3 Scales Directly

**What we chose:** Wrap and integrate D3's scale functions (`d3-scale`)

**Why:**
1. **Battle-Tested**: D3 scales are industry standard
2. **Comprehensive**: Linear, log, time, band, ordinal, etc.
3. **Well-Understood**: Familiar to data viz developers
4. **Save Time**: Don't reinvent the wheel

### Alternatives Considered

#### 1. Build Custom Scale System

```typescript
// Alternative: Custom scales
class LinearScale {
  private domain: [number, number];
  private range: [number, number];
  
  scale(value: number): number {
    // Custom implementation
  }
}
```

**Pros:**
- No D3 dependency
- Smaller bundle (only what we need)
- Full control over implementation

**Cons:**
- ❌ Months of development work
- ❌ Need to handle edge cases
- ❌ Won't be as robust as D3
- ❌ Less familiar to developers
- ❌ Need to maintain long-term

**Why rejected:** D3 scales are excellent. Building our own would take months and wouldn't be better.

#### 2. Simpler Scale API

```typescript
// Alternative: Simple proportional scales
function scale(value: number, from: [number, number], to: [number, number]) {
  return (value - from[0]) / (from[1] - from[0]) * (to[1] - to[0]) + to[0];
}
```

**Pros:**
- Very simple
- No dependencies
- Easy to understand

**Cons:**
- ❌ Only handles linear scales
- ❌ No time scales, log scales, etc.
- ❌ No nice ticks
- ❌ No advanced features

**Why rejected:** Too simplistic. Real charts need logarithmic scales, time scales, and more.

#### 3. Use Observable Plot's Scales

```typescript
// Alternative: Use Plot's scale system
import { Scale } from '@observablehq/plot';
```

**Pros:**
- Modern API
- Well-designed

**Cons:**
- ❌ Less well-known than D3
- ❌ Smaller community
- ❌ Still uses D3 internally anyway
- ❌ Less flexible

**Why rejected:** D3 is more standard and we'd end up with D3 as a dependency anyway.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Robust, tested scales
- ✅ Comprehensive scale types
- ✅ Familiar to developers
- ✅ Active maintenance
- ✅ Extensive documentation

**Costs:**
- ⚠️ D3 dependency (~30KB)
- ⚠️ Learning curve for non-D3 users
- ⚠️ More power than needed for simple charts

**Verdict:** Using D3 scales is clearly the right choice. They're excellent, well-maintained, and save us significant development time.

## Component API

### Decision: Declarative Props-Based API

**What we chose:** Svelte components with props, inspired by Swift Charts

```svelte
<Chart width={600} height={400}>
  <Line data={data} x="x" y="y" stroke="blue" />
  <Axis scale={xScale} type="x" />
</Chart>
```

**Why:**
1. **Declarative**: Clear and easy to read
2. **Composable**: Mix and match components
3. **Type-Safe**: Full TypeScript inference
4. **Svelte-Idiomatic**: Natural Svelte component usage

### Alternatives Considered

#### 1. Configuration Object (Chart.js Style)

```svelte
<script>
  const config = {
    type: 'line',
    data: { datasets: [{ data: data }] },
    options: { scales: { x: { /* ... */ } } }
  };
</script>

<Chart {config} />
```

**Pros:**
- Familiar to Chart.js users
- Can serialize to JSON
- Single prop

**Cons:**
- ❌ Less type-safe (nested objects)
- ❌ Not declarative
- ❌ Harder to compose
- ❌ Not Svelte-idiomatic

**Why rejected:** We wanted declarative components, not configuration objects.

#### 2. Functional API (Observable Plot Style)

```javascript
const plot = Plot.plot({
  marks: [
    Plot.line(data, { x: "x", y: "y", stroke: "blue" })
  ]
});
```

**Pros:**
- Concise
- Functional programming style
- Easy to generate programmatically

**Cons:**
- ❌ Not component-based
- ❌ Doesn't leverage Svelte
- ❌ Less intuitive in templates
- ❌ Harder to compose

**Why rejected:** We're building Svelte components, so component API is most natural.

#### 3. Slots-Based (Alternative Composition)

```svelte
<Chart>
  <svelte:fragment slot="layers">
    <Line {data} />
  </svelte:fragment>
  <svelte:fragment slot="axes">
    <Axis scale={xScale} />
  </svelte:fragment>
</Chart>
```

**Pros:**
- Explicit layer control
- Clear hierarchy

**Cons:**
- ❌ More verbose
- ❌ Boilerplate-heavy
- ❌ Not as clean

**Why rejected:** Simple component children are cleaner than slots for this use case.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Clean, readable code
- ✅ Type-safe
- ✅ Easy to compose
- ✅ Svelte-idiomatic

**Costs:**
- ⚠️ Can't serialize to JSON
- ⚠️ Must use components (not JS objects)
- ⚠️ Slightly more verbose than functional style

**Verdict:** Declarative component API is perfect for Svelte. It's clear, type-safe, and composable.

## TypeScript Strategy

### Decision: TypeScript-First, Full Type Safety

**What we chose:** Write everything in TypeScript with full type inference

**Why:**
1. **Better DX**: Autocomplete, error checking
2. **Self-Documenting**: Types explain the API
3. **Refactoring Safety**: Catch breaking changes
4. **Industry Standard**: TypeScript is expected

### Alternatives Considered

#### 1. JavaScript with JSDoc

```javascript
/**
 * @param {DataPoint[]} data
 * @param {string} x
 * @param {string} y
 */
export function Line({ data, x, y }) {
  // ...
}
```

**Pros:**
- No build step for types
- Easier for some developers

**Cons:**
- ❌ Less type safety
- ❌ Verbose JSDoc
- ❌ No type inference
- ❌ Harder to maintain

**Why rejected:** TypeScript provides much better DX and safety.

#### 2. TypeScript with Loose Types

```typescript
// Alternative: Minimal typing
export function Line(props: any) {
  // ...
}
```

**Pros:**
- Less upfront work
- More flexible

**Cons:**
- ❌ No type safety
- ❌ No autocomplete
- ❌ Defeats the purpose of TypeScript

**Why rejected:** If we're using TypeScript, we should use it properly.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Excellent DX (autocomplete, errors)
- ✅ Self-documenting code
- ✅ Refactoring safety
- ✅ Catches bugs early

**Costs:**
- ⚠️ Initial learning curve
- ⚠️ More verbose in some cases
- ⚠️ Build step required

**Verdict:** TypeScript-first is essential for a modern library. The benefits are overwhelming.

## Build and Distribution

### Decision: SvelteKit Package, ES Modules

**What we chose:** Build with `@sveltejs/package`, distribute as ES modules

**Why:**
1. **Svelte-Standard**: Official Svelte library packaging
2. **Tree-Shakeable**: Import only what you use
3. **Modern**: ES modules are the future
4. **SSR-Compatible**: Works with SvelteKit SSR

### Alternatives Considered

#### 1. UMD Bundle

```javascript
// Alternative: Universal Module Definition
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
    ? define(['exports'], factory)
    : (global = global || self, factory(global.Charts = {}));
}(this, function (exports) { 'use strict';
  // ...
}));
```

**Pros:**
- Works everywhere (AMD, CommonJS, global)
- Browser script tag compatible

**Cons:**
- ❌ Larger bundle (not tree-shakeable)
- ❌ Old pattern
- ❌ Not needed for modern tools

**Why rejected:** ES modules are standard now. UMD is legacy.

#### 2. CommonJS

```javascript
// Alternative: CommonJS
module.exports = { Chart, Line, Bar };
```

**Pros:**
- Node.js standard
- Wide support

**Cons:**
- ❌ Not tree-shakeable
- ❌ Synchronous (blocking)
- ❌ Being phased out

**Why rejected:** ES modules are the future, and Svelte/Vite use them.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Tree-shakeable (smaller bundles)
- ✅ Modern standard
- ✅ Works with all modern tools
- ✅ Svelte-specific optimizations

**Costs:**
- ⚠️ Doesn't work in very old Node.js
- ⚠️ Can't use directly in browser without bundler

**Verdict:** ES modules are clearly the right choice for a modern library.

## Testing Approach

### Decision: Component-Level Testing with Mock Renderers

**What we chose:** Test components with mocked renderers, test renderers separately

**Why:**
1. **Fast**: No browser/DOM required for most tests
2. **Isolated**: Test one thing at a time
3. **Maintainable**: Clear test boundaries
4. **Flexible**: Easy to add test scenarios

### Alternatives Considered

#### 1. End-to-End Visual Testing

```typescript
// Alternative: Screenshot comparisons
test('line chart renders correctly', async () => {
  const screenshot = await renderChart(Line, data);
  expect(screenshot).toMatchImageSnapshot();
});
```

**Pros:**
- Tests actual visual output
- Catches rendering bugs

**Cons:**
- ❌ Slow (renders in browser)
- ❌ Flaky (timing issues)
- ❌ Brittle (breaks on minor changes)
- ❌ Hard to debug

**Why rejected:** Good for integration tests, but too slow for unit tests.

#### 2. Integration Tests Only

```typescript
// Alternative: Only test full stack
test('complete chart renders', () => {
  render(Chart, { /* full chart */ });
  expect(document.querySelector('svg')).toBeInTheDocument();
});
```

**Pros:**
- Tests realistic scenarios
- High confidence

**Cons:**
- ❌ Slow
- ❌ Hard to isolate failures
- ❌ Requires browser environment

**Why rejected:** Need fast feedback. Unit tests are better for development.

### Trade-offs of Our Choice

**Benefits:**
- ✅ Fast test execution
- ✅ Easy to isolate issues
- ✅ No browser required
- ✅ Clear test boundaries

**Costs:**
- ⚠️ Don't test actual rendering
- ⚠️ Need integration tests too
- ⚠️ Mocking overhead

**Verdict:** Unit tests with mocked renderers for speed, integration tests for confidence. Best of both worlds.

## Summary of Decisions

| Decision | What We Chose | Key Reason |
|----------|---------------|------------|
| **Coordinates** | Pancake (0-100) | SSR + Renderer independence |
| **Renderers** | Abstracted interface | Multi-target flexibility |
| **Framework** | Svelte-specific | Deep integration |
| **Scales** | D3 scales | Battle-tested, comprehensive |
| **API** | Declarative components | Svelte-idiomatic |
| **TypeScript** | Full type safety | Better DX |
| **Build** | ES modules | Modern, tree-shakeable |
| **Testing** | Unit + integration | Fast + confident |

## Principles That Guided Decisions

1. **SSR-First**: Every decision considered SSR compatibility
2. **Developer Experience**: Optimize for the developer using the library
3. **Svelte-Idiomatic**: Use Svelte patterns, not fight them
4. **Modern Standards**: Use latest web platform features
5. **Flexibility**: Support multiple use cases (SSR, performance, etc.)
6. **Simplicity**: Keep the API simple even if implementation is complex
7. **Type Safety**: Leverage TypeScript for better DX

## Lessons Learned

### What Worked Well

1. **Pancake Coordinates**: Solved SSR + multi-renderer elegantly
2. **Renderer Abstraction**: Made multi-target support maintainable
3. **D3 Integration**: Saved months of work, excellent result
4. **TypeScript**: Great DX, caught many bugs early

### What We'd Change

1. **WebGPU**: Started too early, should wait for more stable browsers
2. **Animation**: Should have built in from the start, harder to add later
3. **Documentation**: Should have written docs alongside code

### Future Considerations

1. **Plugin System**: May need if community wants extensions
2. **3D Charts**: Would require coordinate system extension
3. **Real-Time**: Might need optimization for streaming data
4. **Accessibility**: Need to invest more in ARIA support

## Conclusion

Every design decision involves trade-offs. We prioritized:
- ✅ SSR compatibility
- ✅ Developer experience
- ✅ Flexibility (multi-renderer)
- ✅ Type safety
- ✅ Svelte integration

These choices shaped a library that's:
- **Unique**: Multi-renderer with SSR support
- **Practical**: Solves real problems for Svelte developers
- **Maintainable**: Clean architecture, good tests
- **Extensible**: Easy to add features

Not every decision will satisfy everyone, but they form a coherent whole that serves the library's goals.
