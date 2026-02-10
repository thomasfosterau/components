# Utilities API Reference

Complete reference for utility functions, scales, and helper methods in @thomasfosterau/charts.

## Scale Functions

### createScale

Creates a D3 scale of the specified type.

**Signature:**
```typescript
function createScale(type: ScaleType): Scale
```

**Parameters:**
- `type`: Scale type - 'linear', 'log', 'time', 'band', 'ordinal', 'point', 'sqrt', 'pow'

**Returns:** D3 scale instance with `.domain()` and `.range()` methods

**Usage:**

```javascript
import { createScale } from '@thomasfosterau/charts';

// Linear scale for continuous data
const linearScale = createScale('linear')
  .domain([0, 100])
  .range([0, 600]);

// Time scale for dates
const timeScale = createScale('time')
  .domain([new Date('2024-01-01'), new Date('2024-12-31')])
  .range([0, 600]);

// Band scale for categorical data
const bandScale = createScale('band')
  .domain(['A', 'B', 'C'])
  .range([0, 600])
  .padding(0.2);
```

### getNiceDomain

Calculates an optimal domain range with padding and nice rounding.

**Signature:**
```typescript
function getNiceDomain(values: number[], padding?: number): [number, number]
```

**Parameters:**
- `values`: Array of numeric values
- `padding` (optional): Padding as fraction of range (default: 0.1 = 10%)

**Returns:** Tuple of [min, max] with padding applied

**Usage:**

```javascript
import { getNiceDomain } from '@thomasfosterau/charts';

const values = [23, 45, 67, 89, 12, 34];

// With default 10% padding
const domain = getNiceDomain(values);
// Returns approximately [8, 92]

// With custom padding
const tightDomain = getNiceDomain(values, 0);
// Returns [12, 89]

const looseDomain = getNiceDomain(values, 0.2);
// Returns [4, 96]
```

### getTicks

Generates evenly-spaced tick values for a domain.

**Signature:**
```typescript
function getTicks(domain: [number, number], count?: number): number[]
```

**Parameters:**
- `domain`: Domain range as [min, max]
- `count` (optional): Desired number of ticks (default: 10)

**Returns:** Array of tick values

**Usage:**

```javascript
import { getTicks } from '@thomasfosterau/charts';

const ticks = getTicks([0, 100], 5);
// Returns [0, 25, 50, 75, 100]

const moreTicks = getTicks([0, 100], 10);
// Returns [0, 10, 20, 30, ..., 90, 100]
```

### formatTick

Formats a tick value for display.

**Signature:**
```typescript
function formatTick(value: number | Date, type?: ScaleType): string
```

**Parameters:**
- `value`: Value to format
- `type` (optional): Scale type for context-aware formatting (default: 'linear')

**Returns:** Formatted string

**Usage:**

```javascript
import { formatTick } from '@thomasfosterau/charts';

// Numeric formatting
formatTick(1500);        // "1.5K"
formatTick(1000000);     // "1.0M"
formatTick(42);          // "42"

// Date formatting
formatTick(new Date('2024-01-15'), 'time');
// "Jan 15, 2024"
```

### Individual Scale Creators

Convenience functions for creating specific scale types:

```javascript
import { 
  scaleLinear,
  scaleLog,
  scaleTime,
  scaleBand,
  scaleOrdinal,
  scalePoint,
  scaleSqrt,
  scalePow
} from '@thomasfosterau/charts';

// Equivalent to createScale('linear')
const scale = scaleLinear()
  .domain([0, 100])
  .range([0, 600]);
```

## Coordinate Conversion

### pancakeToPixels

Converts a pancake percentage to pixel coordinates.

**Signature:**
```typescript
function pancakeToPixels(
  value: number,
  size: number,
  marginStart?: number,
  marginEnd?: number
): number
```

**Parameters:**
- `value`: Pancake coordinate (0-100)
- `size`: Total size in pixels (width or height)
- `marginStart` (optional): Left/top margin (default: 0)
- `marginEnd` (optional): Right/bottom margin (default: 0)

**Returns:** Pixel coordinate

**Usage:**

```javascript
import { pancakeToPixels } from '@thomasfosterau/charts';

const width = 600;
const margin = { left: 50, right: 50 };

// Convert 50% to pixel position
const xPixel = pancakeToPixels(50, width, margin.left, margin.right);
// Returns 300 (center of 500px available space)

// Convert 0% (left edge)
const leftPixel = pancakeToPixels(0, width, margin.left, margin.right);
// Returns 50 (left margin)
```

### pixelsToPancake

Converts pixel coordinates to pancake percentage.

**Signature:**
```typescript
function pixelsToPancake(
  value: number,
  size: number,
  marginStart?: number,
  marginEnd?: number
): number
```

**Parameters:**
- `value`: Pixel coordinate
- `size`: Total size in pixels (width or height)
- `marginStart` (optional): Left/top margin (default: 0)
- `marginEnd` (optional): Right/bottom margin (default: 0)

**Returns:** Pancake coordinate (0-100)

**Usage:**

```javascript
import { pixelsToPancake } from '@thomasfosterau/charts';

const width = 600;
const margin = { left: 50, right: 50 };

// Convert pixel 300 to pancake
const pancakeX = pixelsToPancake(300, width, margin.left, margin.right);
// Returns 50 (50%)

// Convert left edge
const leftPancake = pixelsToPancake(50, width, margin.left, margin.right);
// Returns 0 (0%)
```

### pancakePointToPixels

Converts a pancake point to pixel coordinates.

**Signature:**
```typescript
function pancakePointToPixels(
  point: PancakePoint,
  width: number,
  height: number,
  margin: Margin
): { x: number; y: number }
```

**Usage:**

```javascript
import { pancakePointToPixels } from '@thomasfosterau/charts';

const point = { x: 50, y: 50 }; // Center in pancake coordinates
const pixels = pancakePointToPixels(
  point,
  600,  // width
  400,  // height
  { top: 20, right: 20, bottom: 40, left: 50 }
);
// Returns { x: 300, y: 200 } (center in pixel coordinates)
```

### pancakeCoordsToPixels

Converts pancake coordinates to pixel coordinates.

**Signature:**
```typescript
function pancakeCoordsToPixels(
  coords: PancakeCoordinates,
  width: number,
  height: number,
  margin: Margin
): { x1: number; y1: number; x2: number; y2: number }
```

**Usage:**

```javascript
import { pancakeCoordsToPixels } from '@thomasfosterau/charts';

const coords = { x1: 10, y1: 10, x2: 90, y2: 90 };
const pixels = pancakeCoordsToPixels(
  coords,
  600,
  400,
  { top: 20, right: 20, bottom: 40, left: 50 }
);
```

## Math Utilities

### clamp

Clamps a value between min and max.

**Signature:**
```typescript
function clamp(value: number, min: number, max: number): number
```

**Usage:**

```javascript
import { clamp } from '@thomasfosterau/charts';

clamp(150, 0, 100);  // Returns 100
clamp(-10, 0, 100);  // Returns 0
clamp(50, 0, 100);   // Returns 50
```

### lerp

Linear interpolation between two values.

**Signature:**
```typescript
function lerp(start: number, end: number, t: number): number
```

**Parameters:**
- `start`: Start value
- `end`: End value
- `t`: Interpolation factor (0-1)

**Usage:**

```javascript
import { lerp } from '@thomasfosterau/charts';

lerp(0, 100, 0);    // Returns 0
lerp(0, 100, 0.5);  // Returns 50
lerp(0, 100, 1);    // Returns 100
lerp(10, 20, 0.25); // Returns 12.5
```

### range

Creates an array of numbers from start to end.

**Signature:**
```typescript
function range(start: number, end: number, step?: number): number[]
```

**Usage:**

```javascript
import { range } from '@thomasfosterau/charts';

range(0, 5);       // [0, 1, 2, 3, 4]
range(0, 10, 2);   // [0, 2, 4, 6, 8]
range(5, 10);      // [5, 6, 7, 8, 9]
```

## Formatting Utilities

### formatNumber

Formats numbers with K/M/B suffixes.

**Signature:**
```typescript
function formatNumber(value: number, decimals?: number): string
```

**Parameters:**
- `value`: Number to format
- `decimals` (optional): Decimal places (default: 1)

**Usage:**

```javascript
import { formatNumber } from '@thomasfosterau/charts';

formatNumber(1500);        // "1.5K"
formatNumber(1000000);     // "1.0M"
formatNumber(1500000000);  // "1.5B"
formatNumber(42);          // "42"
formatNumber(1234.56, 2);  // "1.23K"
```

### uniqueId

Generates a unique ID string.

**Signature:**
```typescript
function uniqueId(prefix?: string): string
```

**Usage:**

```javascript
import { uniqueId } from '@thomasfosterau/charts';

uniqueId();           // "chart_1"
uniqueId();           // "chart_2"
uniqueId('axis');     // "axis_1"
```

## Theme Utilities

### getColorFromPalette

Gets a color from a named palette.

**Signature:**
```typescript
function getColorFromPalette(palette: string, index: number): string
```

**Parameters:**
- `palette`: Palette name - 'default', 'pastel', 'vibrant', 'monochrome'
- `index`: Color index (wraps around if exceeds palette length)

**Usage:**

```javascript
import { getColorFromPalette } from '@thomasfosterau/charts';

getColorFromPalette('vibrant', 0);  // "#ff6b6b"
getColorFromPalette('vibrant', 1);  // "#4ecdc4"
getColorFromPalette('pastel', 0);   // "#a0d8f1"
```

### mergeTheme

Merges a custom theme with a base theme.

**Signature:**
```typescript
function mergeTheme(baseTheme: Theme, customTheme: Partial<Theme>): Theme
```

**Usage:**

```javascript
import { mergeTheme, defaultTheme } from '@thomasfosterau/charts';

const myTheme = mergeTheme(defaultTheme, {
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4'
  },
  fonts: {
    base: 'Roboto, sans-serif'
  }
});
```

## Constants

### colorPalettes

Object containing all built-in color palettes.

```javascript
import { colorPalettes } from '@thomasfosterau/charts';

console.log(colorPalettes.default);
// ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac']

console.log(colorPalettes.vibrant);
// ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3']
```

### defaultTheme

Default theme object.

```javascript
import { defaultTheme } from '@thomasfosterau/charts';

console.log(defaultTheme.colors.primary); // "#4299e1"
```

### darkTheme

Dark theme object.

```javascript
import { darkTheme } from '@thomasfosterau/charts';

console.log(darkTheme.colors.background); // Dark background color
```

## Context Functions

### getChartContext

Gets the chart context from a child component.

**Signature:**
```typescript
function getChartContext(): ChartContext
```

**Returns:** ChartContext object with renderer, width, height, margin

**Usage:**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '@thomasfosterau/charts';

  const { renderer, width, height, margin } = getChartContext();

  onMount(() => {
    // Use renderer to draw custom elements
    renderer.circle({ x: 50, y: 50 }, 10, '#4299e1');
  });
</script>
```

### setChartContext

Sets the chart context (used internally by Chart component).

**Signature:**
```typescript
function setChartContext(context: ChartContext): void
```

**Note:** This is an internal function used by the Chart component. You typically don't need to call this directly.

## Examples

### Creating a Complete Scale Setup

```javascript
import { 
  createScale, 
  getNiceDomain 
} from '@thomasfosterau/charts';

const data = [
  { date: new Date('2024-01-01'), value: 100 },
  { date: new Date('2024-02-01'), value: 150 },
  { date: new Date('2024-03-01'), value: 125 }
];

// Extract values
const dates = data.map(d => d.date);
const values = data.map(d => d.value);

// Create scales with nice domains
const xScale = createScale('time')
  .domain([dates[0], dates[dates.length - 1]])
  .range([50, 550]);

const yScale = createScale('linear')
  .domain(getNiceDomain(values, 0.1))
  .range([360, 40]);
```

### Custom Tick Formatting

```javascript
import { formatTick, formatNumber } from '@thomasfosterau/charts';

// Currency formatting
function formatCurrency(value) {
  return `$${formatNumber(value)}`;
}

// Percentage formatting
function formatPercentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

// Date formatting
function formatDate(date) {
  return formatTick(date, 'time');
}
```

### Working with Pancake Coordinates

```javascript
import { 
  pancakeToPixels,
  pixelsToPancake,
  pancakePointToPixels 
} from '@thomasfosterau/charts';

const width = 600;
const height = 400;
const margin = { top: 20, right: 20, bottom: 40, left: 50 };

// Convert pancake point to pixels
const pancakePoint = { x: 50, y: 50 }; // Center
const pixelPoint = pancakePointToPixels(pancakePoint, width, height, margin);

// Convert individual coordinates
const xPixel = pancakeToPixels(50, width, margin.left, margin.right);
const yPixel = pancakeToPixels(50, height, margin.top, margin.bottom);

// Convert back
const pancakeX = pixelsToPancake(xPixel, width, margin.left, margin.right);
const pancakeY = pixelsToPancake(yPixel, height, margin.top, margin.bottom);
```

## Best Practices

1. **Use getNiceDomain for automatic ranges**: Provides visually pleasing domains
2. **Cache scale objects**: Create scales once and reuse them
3. **Format consistently**: Use the same formatters across related charts
4. **Leverage utility functions**: Use built-in utilities instead of reimplementing

## Further Reading

- [Components Reference](./components.md) - Chart components
- [Scales Guide](../guides/scales-and-domains.md) - In-depth scale guide
- [Custom Components Tutorial](../tutorials/03-custom-components.md) - Build custom components
- [API Overview](./README.md) - Quick reference
