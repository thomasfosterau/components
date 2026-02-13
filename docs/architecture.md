# Architecture

This document provides a comprehensive overview of the `@thomasfosterau/charts` library architecture, explaining how all components work together to create a flexible, performant charting solution.

## Overview

The library is built with a layered architecture that separates concerns into distinct modules:

```
┌─────────────────────────────────────────────────────┐
│           Svelte Components Layer                    │
│  (Chart, Line, Bar, Scatter, Area, Pie, Axis, etc.) │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Context Layer                           │
│        (ChartContext, Theme System)                  │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│           Renderer Abstraction                       │
│          (Renderer Interface)                        │
└─────┬──────────────┬──────────────┬─────────────────┘
      │              │              │
┌─────▼────┐   ┌────▼─────┐   ┌───▼──────┐
│   SVG    │   │  Canvas  │   │  WebGPU  │
│ Renderer │   │ Renderer │   │ Renderer │
└──────────┘   └──────────┘   └──────────┘
      │              │              │
┌─────▼──────────────▼──────────────▼─────────────────┐
│          Pancake Coordinate System                   │
│            (0-100 percentage space)                  │
└──────────────────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│         Utilities & Scale System                     │
│     (D3 Scales, Formatting, Data Transforms)         │
└─────────────────────────────────────────────────────┘
```

## Core Layers

### 1. Svelte Components Layer

The top layer consists of declarative Svelte components that users interact with directly. Each component is responsible for:
- Accepting user props (data, styling, configuration)
- Accessing the chart context
- Transforming data using scales
- Converting data to Pancake coordinates
- Calling renderer methods to draw

**Key Components:**

#### Chart.svelte
The root container that:
- Creates and initializes the renderer based on `renderTarget` prop
- Sets up the chart context for child components
- Manages width, height, and margins
- Provides the renderer instance to all children

```svelte
<script>
  import { setContext, onMount } from 'svelte';
  import { createRenderer } from './renderers';
  
  export let renderTarget = 'svg';
  export let width = 600;
  export let height = 400;
  
  let renderer = createRenderer(renderTarget);
  
  onMount(() => {
    renderer.initialize(width, height);
  });
  
  setContext('chart', { renderer, width, height, margin });
</script>
```

#### Chart Type Components (Line, Bar, Scatter, etc.)
These components:
1. Get chart context via `getChartContext()`
2. Accept data and accessor props (x, y keys)
3. Create or receive scale instances
4. Transform data points to Pancake coordinates
5. Use renderer methods to draw visualizations

Example flow for Line component:
```
User Data → Scale Transformation → Pancake Coords → Renderer → Output
[{x:1,y:10}] → scale(1)=20% → {x:20,y:45} → lineTo() → SVG/Canvas
```

### 2. Context Layer

The context system provides a clean way to share state between parent Chart and child components.

**src/lib/core/context.ts**

```typescript
interface ChartContext {
  renderer: Renderer;
  width: number;
  height: number;
  margin: Margin;
}

export function getChartContext(): ChartContext {
  return getContext('chart');
}
```

Benefits:
- Avoids prop drilling
- Components don't need to know about their parents
- Easy to add new context values
- Type-safe with TypeScript

**Theme Context:**

The theme system also uses context to provide theming throughout the component tree:

```typescript
interface ThemeContext {
  theme: Theme;
  colorPalette: ColorPalette;
}
```

### 3. Renderer Abstraction

The heart of the architecture is the renderer abstraction. All renderers implement the same `Renderer` interface, making them completely interchangeable.

**src/lib/types/index.ts**

```typescript
interface Renderer {
  readonly type: RenderTarget;
  initialize(width: number, height: number): void;
  clear(): void;
  beginPath(): void;
  moveTo(point: PancakePoint): void;
  lineTo(point: PancakePoint): void;
  closePath(): void;
  stroke(color?: string, width?: number): void;
  fill(color?: string): void;
  circle(point: PancakePoint, radius: number, ...): void;
  rect(coords: PancakeCoordinates, ...): void;
  text(point: PancakePoint, text: string, ...): void;
  setOpacity(alpha: number): void;
  getOutput(): unknown;
}
```

**Why this design?**
- **Separation of concerns**: Components don't care about rendering details
- **Testability**: Easy to mock renderers for testing
- **Extensibility**: New renderers can be added without changing components
- **Performance**: Each renderer can optimize for its target (SVG, Canvas, GPU)

### 4. Renderer Implementations

Each renderer converts Pancake coordinates to its native coordinate system:

#### SVGRenderer (src/lib/renderers/svg.ts)
- Generates SVG markup as strings
- SSR-compatible (no DOM dependencies)
- Uses `escapeHtml()` to prevent XSS vulnerabilities
- Accumulates SVG elements in array, joins on `getOutput()`

```typescript
class SVGRenderer implements Renderer {
  private elements: string[] = [];
  private currentPath: string = '';
  
  moveTo(point: PancakePoint): void {
    const [px, py] = this.toPx(point);
    this.currentPath += `M ${px} ${py} `;
  }
  
  private toPx(point: PancakePoint): [number, number] {
    return [
      (point.x / 100) * this.width,
      (point.y / 100) * this.height
    ];
  }
}
```

#### CanvasRenderer (src/lib/renderers/canvas.ts)
- Uses Canvas 2D API
- High-performance for large datasets
- Stateful rendering (manages canvas context)
- Requires browser environment

```typescript
class CanvasRenderer implements Renderer {
  private ctx: CanvasRenderingContext2D;
  
  lineTo(point: PancakePoint): void {
    const [px, py] = this.toPx(point);
    this.ctx.lineTo(px, py);
  }
}
```

#### WebGPURenderer (src/lib/renderers/webgpu.ts)
- GPU-accelerated rendering
- Best for very large datasets
- Currently experimental
- Uses compute shaders for data transformation

### 5. Pancake Coordinate System

All positions are specified as percentages (0-100) rather than pixels:
- `x: 0` = left edge, `x: 100` = right edge
- `y: 0` = top edge, `y: 100` = bottom edge

**Benefits:**
1. **Renderer Independence**: Same coordinates work for SVG, Canvas, WebGPU
2. **SSR Compatibility**: No need to know actual pixel dimensions at render time
3. **Responsive**: Scales naturally to any container size
4. **Simplicity**: Easier to reason about than pixel calculations

**Conversion:**
```typescript
function toPancake(
  dataValue: number,
  scale: Scale,
  dimension: 'x' | 'y'
): number {
  const pixels = scale(dataValue);
  const size = dimension === 'x' ? width : height;
  return (pixels / size) * 100;
}
```

See [pancake-system.md](./pancake-system.md) for detailed explanation.

### 6. Scale System

Built on D3's battle-tested scale system:

**src/lib/scales/index.ts**

```typescript
export function createScale(type: ScaleType): Scale {
  switch (type) {
    case 'linear': return scaleLinear();
    case 'log': return scaleLog();
    case 'time': return scaleTime();
    case 'band': return scaleBand();
    // ... more scale types
  }
}
```

**Why D3 scales?**
- Industry standard
- Comprehensive (linear, log, time, band, ordinal, etc.)
- Well-tested and optimized
- Familiar to developers coming from D3.js

**Scale Integration:**

Components can receive scales as props or create defaults:

```typescript
export let xScale = createScale('linear')
  .domain(extent(data, d => d[x]))
  .range([0, width]);
```

The scale system is separate from the coordinate system:
```
Data Space → [Scale] → Pixel Space → [Pancake] → Percentage Space
10 → scale(10)=200px → 200/600=33.3%
```

## Data Flow

Complete data flow through the library:

```
1. User provides data
   └─ [{x: 1, y: 10}, {x: 2, y: 20}, ...]

2. Component receives data + accessors
   └─ data={data} x="x" y="y"

3. Scale transforms data to pixels
   └─ xScale(1) = 50px, yScale(10) = 350px

4. Convert pixels to Pancake coordinates
   └─ 50px/600px = 8.33%, 350px/400px = 87.5%

5. Renderer draws in native format
   ├─ SVG: <path d="M 50 350 L ..."/>
   ├─ Canvas: ctx.moveTo(50, 350); ctx.lineTo(...)
   └─ WebGPU: vertex buffer with coordinates

6. Output rendered to DOM/canvas
```

## Component Lifecycle

Typical lifecycle of a chart component:

```typescript
<script>
  // 1. Imports and setup
  import { onMount } from 'svelte';
  import { getChartContext } from '../core/context';
  
  // 2. Props
  export let data;
  export let x;
  export let y;
  
  // 3. Get context
  const { renderer, width, height } = getChartContext();
  
  // 4. Create scales (reactive)
  $: xScale = createScale('linear')
    .domain(extent(data, d => d[x]))
    .range([0, width]);
  
  // 5. Transform data (reactive)
  $: points = data.map(d => ({
    x: toPancake(xScale(d[x]), width),
    y: toPancake(yScale(d[y]), height)
  }));
  
  // 6. Render on mount or when data changes
  $: if (renderer && points.length) {
    drawChart(points);
  }
  
  function drawChart(points) {
    renderer.clear();
    renderer.beginPath();
    points.forEach((p, i) => {
      if (i === 0) renderer.moveTo(p);
      else renderer.lineTo(p);
    });
    renderer.stroke('#4299e1', 2);
  }
</script>
```

## Error Handling

The library employs defensive programming:

1. **Type Safety**: TypeScript catches many errors at compile time
2. **Default Values**: All props have sensible defaults
3. **Graceful Degradation**: Missing data or invalid props don't crash
4. **Validation**: Scales validate domains and ranges
5. **XSS Prevention**: SVG renderer escapes all text content

## Performance Considerations

### Component Level
- Reactive statements (`$:`) minimize recalculation
- Svelte's compiler optimizes away unused props
- Data transformations are memoized when possible

### Renderer Level
- SVG: Minimal for SSR, reasonable for < 1000 points
- Canvas: Optimized for > 1000 points, uses batching
- WebGPU: GPU-accelerated for > 10000 points

See [performance.md](./performance.md) for detailed benchmarks.

## Extensibility Points

The architecture provides several extension points:

1. **Custom Chart Components**: Create new chart types using `getChartContext()`
2. **Custom Renderers**: Implement `Renderer` interface for new targets
3. **Custom Scales**: Wrap or extend D3 scales
4. **Custom Themes**: Create theme objects following `Theme` interface
5. **Data Transformers**: Add utilities for data processing

See [extending.md](./extending.md) for guides on each.

## File Organization

```
src/lib/
├── components/           # Svelte components
│   ├── Chart.svelte     # Root container
│   ├── Line.svelte      # Line chart
│   ├── Bar.svelte       # Bar chart
│   ├── Scatter.svelte   # Scatter plot
│   ├── Area.svelte      # Area chart
│   ├── Pie.svelte       # Pie chart
│   ├── Axis.svelte      # Axis component
│   ├── Grid.svelte      # Grid lines
│   └── Legend.svelte    # Chart legend
├── core/                # Core functionality
│   ├── context.ts       # Svelte context utilities
│   ├── theme.ts         # Theme system
│   └── index.ts         # Core exports
├── renderers/           # Renderer implementations
│   ├── index.ts         # Renderer factory
│   ├── svg.ts           # SVG renderer
│   ├── canvas.ts        # Canvas renderer
│   └── webgpu.ts        # WebGPU renderer
├── scales/              # Scale utilities
│   └── index.ts         # D3 scale wrappers
├── types/               # TypeScript definitions
│   └── index.ts         # All type definitions
├── utils/               # Utility functions
│   └── index.ts         # Helper functions
└── index.ts             # Main library export
```

## Key Design Patterns

### 1. Strategy Pattern
Renderer abstraction uses strategy pattern - algorithm (rendering) is selected at runtime.

### 2. Factory Pattern
`createRenderer()` and `createScale()` use factory pattern to instantiate appropriate implementations.

### 3. Context Pattern
Svelte context provides dependency injection without prop drilling.

### 4. Composition over Inheritance
Components compose behaviors rather than inherit from base classes.

### 5. Reactive Programming
Svelte's reactive statements drive automatic updates.

## Testing Strategy

1. **Unit Tests**: Test utilities and scale functions independently
2. **Component Tests**: Test components with mock renderers
3. **Integration Tests**: Test complete chart rendering
4. **Visual Regression**: Screenshot comparisons for UI
5. **Performance Tests**: Benchmark renderers with various data sizes

## Future Architecture Considerations

### Planned Enhancements
1. **Animation System**: Time-based interpolation layer
2. **Interaction Layer**: Event handling abstraction
3. **Plugin System**: Loadable extensions
4. **Worker Support**: Offload calculations to Web Workers

### Potential Refactorings
1. Split large components into smaller sub-components
2. Add caching layer for expensive calculations
3. Introduce virtual scrolling for large datasets
4. Add component registry for dynamic loading

## Conclusion

The architecture balances several concerns:
- **Simplicity**: Easy to understand and use
- **Performance**: Optimized for different use cases
- **Flexibility**: Multiple renderers, scales, chart types
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features

The Pancake coordinate system and renderer abstraction are the key innovations that enable this flexibility while maintaining simplicity.
