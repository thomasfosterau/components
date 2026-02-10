# Flowchart and Diagram Building Blocks

This document describes the low-level building blocks added to `@thomasfosterau/charts` for creating flowcharts, diagrams, and entity relationship diagrams (ERDs).

## Overview

The library now includes:
- **Shape Components**: Basic geometric shapes for diagram nodes
- **Connector Components**: Lines and arrows for linking nodes
- **Renderer Methods**: Low-level primitives for custom visualizations

All components use the Pancake coordinate system (0-100%) for positions and pixel units for sizes.

## Shape Components

### Box
A rectangle with optional rounded corners. Perfect for process nodes in flowcharts.

```svelte
<Box 
  x1={10} y1={20} 
  x2={30} y2={40} 
  fill="#e3f2fd" 
  stroke="#1976d2" 
  strokeWidth={2}
  rounded={true}
  radius={5}
/>
```

**Props:**
- `x1`, `y1`, `x2`, `y2`: Pancake coordinates (0-100)
- `fill`: Fill color (optional)
- `stroke`: Border color (default: `#000000`)
- `strokeWidth`: Border width in pixels (default: `2`)
- `rounded`: Enable rounded corners (default: `false`)
- `radius`: Corner radius in pixels when rounded (default: `5`)

### Diamond
A diamond/rhombus shape for decision nodes.

```svelte
<Diamond 
  centerX={50} 
  centerY={50} 
  width={20} 
  height={30}
  fill="#fff3e0" 
  stroke="#f57c00" 
  strokeWidth={2}
/>
```

**Props:**
- `centerX`, `centerY`: Center position in Pancake coordinates
- `width`, `height`: Size as percentage of canvas
- `fill`: Fill color (optional)
- `stroke`: Border color (default: `#000000`)
- `strokeWidth`: Border width in pixels (default: `2`)

### Ellipse
An ellipse/oval shape for terminal nodes (start/end).

```svelte
<Ellipse 
  centerX={50} 
  centerY={50} 
  radiusX={10} 
  radiusY={15}
  fill="#e8f5e9" 
  stroke="#388e3c" 
  strokeWidth={2}
/>
```

**Props:**
- `centerX`, `centerY`: Center position in Pancake coordinates
- `radiusX`, `radiusY`: Horizontal and vertical radii in pixels
- `fill`: Fill color (optional)
- `stroke`: Border color (default: `#000000`)
- `strokeWidth`: Border width in pixels (default: `2`)

### Parallelogram
A parallelogram for input/output operations.

```svelte
<Parallelogram 
  x1={20} y1={30} 
  x2={40} y2={50}
  skew={5}
  fill="#fce4ec" 
  stroke="#c2185b" 
  strokeWidth={2}
/>
```

**Props:**
- `x1`, `y1`, `x2`, `y2`: Bounding box in Pancake coordinates
- `skew`: Horizontal skew amount (default: `10`)
- `fill`: Fill color (optional)
- `stroke`: Border color (default: `#000000`)
- `strokeWidth`: Border width in pixels (default: `2`)

### Polygon
A custom polygon from an array of points.

```svelte
<Polygon 
  points={[
    { x: 50, y: 20 },
    { x: 70, y: 50 },
    { x: 50, y: 80 },
    { x: 30, y: 50 }
  ]}
  fill="#e1f5fe"
  stroke="#0277bd"
  strokeWidth={2}
/>
```

**Props:**
- `points`: Array of `{ x, y }` points in Pancake coordinates
- `fill`: Fill color (optional)
- `stroke`: Border color (default: `#000000`)
- `strokeWidth`: Border width in pixels (default: `2`)

### Text
A text label for annotations.

```svelte
<Text 
  x={50} 
  y={50} 
  text="Process Data"
  fontSize={14}
  textAnchor="middle"
  fill="#000000"
/>
```

**Props:**
- `x`, `y`: Position in Pancake coordinates
- `text`: Text content
- `fontSize`: Font size in pixels (default: `12`)
- `fontFamily`: Font family (default: `sans-serif`)
- `fontWeight`: Font weight (default: `normal`)
- `textAnchor`: Alignment - `start`, `middle`, or `end` (default: `middle`)
- `fill`: Text color (default: `#000000`)
- `stroke`: Text stroke color (optional)
- `rotation`: Rotation angle in degrees (optional)

## Connector Components

### Arrow
A straight line with an arrow head.

```svelte
<Arrow 
  startX={30} startY={50} 
  endX={60} endY={50}
  stroke="#1976d2" 
  strokeWidth={2}
  arrowSize={8}
/>
```

**Props:**
- `startX`, `startY`, `endX`, `endY`: Line endpoints in Pancake coordinates
- `stroke`: Line color (default: `#000000`)
- `strokeWidth`: Line width in pixels (default: `2`)
- `arrowSize`: Arrow head size in pixels (default: `8`)
- `showArrow`: Show arrow head (default: `true`)

### CurvedLine
A cubic Bezier curve connector.

```svelte
<CurvedLine 
  startX={20} startY={50} 
  endX={80} endY={50}
  controlX1={40} controlY1={30}
  controlX2={60} controlY2={70}
  stroke="#388e3c" 
  strokeWidth={2}
/>
```

**Props:**
- `startX`, `startY`, `endX`, `endY`: Curve endpoints in Pancake coordinates
- `controlX1`, `controlY1`: First control point (auto-calculated if omitted)
- `controlX2`, `controlY2`: Second control point (auto-calculated if omitted)
- `stroke`: Line color (default: `#000000`)
- `strokeWidth`: Line width in pixels (default: `2`)

### ConnectorLine
A multi-segment line for orthogonal connections.

```svelte
<ConnectorLine 
  points={[
    { x: 10, y: 50 },
    { x: 30, y: 50 },
    { x: 30, y: 70 },
    { x: 50, y: 70 }
  ]}
  stroke="#f57c00" 
  strokeWidth={2}
/>
```

**Props:**
- `points`: Array of `{ x, y }` points in Pancake coordinates
- `stroke`: Line color (default: `#000000`)
- `strokeWidth`: Line width in pixels (default: `2`)

## Renderer Methods

If you need more control, you can use the low-level renderer methods directly:

### ellipse()
```typescript
renderer.ellipse(
  center: PancakePoint,
  radiusX: number,
  radiusY: number,
  fill?: string,
  stroke?: string,
  strokeWidth?: number
)
```

### roundedRect()
```typescript
renderer.roundedRect(
  coords: PancakeCoordinates,
  radius: number,
  fill?: string,
  stroke?: string,
  strokeWidth?: number
)
```

### polygon()
```typescript
renderer.polygon(
  points: PancakePoint[],
  fill?: string,
  stroke?: string,
  strokeWidth?: number
)
```

### bezierCurve()
```typescript
renderer.bezierCurve(
  start: PancakePoint,
  cp1: PancakePoint,
  cp2: PancakePoint,
  end: PancakePoint,
  stroke?: string,
  strokeWidth?: number
)
```

### arrow()
```typescript
renderer.arrow(
  start: PancakePoint,
  end: PancakePoint,
  stroke?: string,
  strokeWidth?: number,
  arrowSize?: number
)
```

## Complete Example

Here's a simple flowchart demonstrating the building blocks:

```svelte
<script>
  import { Chart, Box, Diamond, Ellipse, Text, Arrow } from '@thomasfosterau/charts';
</script>

<Chart width={600} height={400} renderTarget="svg">
  <!-- Start node -->
  <Ellipse centerX={50} centerY={10} radiusX={8} radiusY={6} 
           fill="#e8f5e9" stroke="#388e3c" strokeWidth={2} />
  <Text x={50} y={10} text="Start" />
  
  <!-- Arrow -->
  <Arrow startX={50} startY={16} endX={50} endY={25} />
  
  <!-- Process node -->
  <Box x1={40} y1={25} x2={60} y2={40} 
       fill="#e3f2fd" stroke="#1976d2" strokeWidth={2} />
  <Text x={50} y={32.5} text="Process" />
  
  <!-- Arrow -->
  <Arrow startX={50} startY={40} endX={50} endY={47} />
  
  <!-- Decision node -->
  <Diamond centerX={50} centerY={57} width={20} height={20}
           fill="#fff3e0" stroke="#f57c00" strokeWidth={2} />
  <Text x={50} y={57} text="Valid?" fontSize={12} />
  
  <!-- Yes arrow -->
  <Arrow startX={60} startY={57} endX={75} endY={57} stroke="#388e3c" />
  <Text x={67.5} y={53} text="Yes" fontSize={11} fill="#388e3c" />
  
  <!-- Success -->
  <Box x1={75} y1={50} x2={95} y2={64} rounded={true} radius={5}
       fill="#e8f5e9" stroke="#388e3c" strokeWidth={2} />
  <Text x={85} y={57} text="Success" />
  
  <!-- No arrow -->
  <Arrow startX={50} startY={67} endX={50} endY={73} stroke="#d32f2f" />
  <Text x={45} y={70} text="No" fontSize={11} fill="#d32f2f" />
  
  <!-- Error -->
  <Box x1={40} y1={73} x2={60} y2={87} rounded={true} radius={5}
       fill="#ffebee" stroke="#d32f2f" strokeWidth={2} />
  <Text x={50} y={80} text="Error" />
</Chart>
```

## Render Targets

All components work with SVG, Canvas, and WebGPU render targets:

```svelte
<!-- Server-side rendering compatible -->
<Chart renderTarget="svg">
  <Box ... />
</Chart>

<!-- High-performance Canvas -->
<Chart renderTarget="canvas">
  <Diamond ... />
</Chart>

<!-- GPU-accelerated (experimental) -->
<Chart renderTarget="webgpu">
  <Ellipse ... />
</Chart>
```

## Notes

- **Positions** use Pancake coordinates (0-100%)
- **Sizes** (radius, strokeWidth, arrowSize) use pixel units
- All shapes support fill and stroke colors
- Components automatically use the chart's renderer from context
- XSS protection is built-in for SVG text and attributes

## See Also

- [flowchart-demo.html](../flowchart-demo.html) - Interactive demo with examples
- [API.md](../API.md) - Complete API reference
- [README.md](../README.md) - Main library documentation
