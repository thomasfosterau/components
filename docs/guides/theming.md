# Guide: Theming

Learn how to customize the appearance of your charts with themes, color palettes, and styling options.

## Overview

@thomasfosterau/charts provides a flexible theming system that allows you to:

- Use built-in themes (default, dark)
- Apply color palettes
- Create custom themes
- Override individual component styles

## Built-in Themes

The library provides theme objects that you can use with your chart components. While Chart doesn't accept a theme prop directly, you can use theme values to style individual components.

### Default Theme

The default theme provides a clean, professional look suitable for most applications.

```svelte
<script>
  import { Chart, Line, Axis } from '@thomasfosterau/charts';
  import { defaultTheme } from '@thomasfosterau/charts';
</script>

<!-- Use theme colors in component props -->
<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke={defaultTheme.colors.primary} />
  <Axis scale={xScale} type="x" position="bottom" />
</Chart>
```

### Dark Theme

Use the dark theme for dark mode interfaces:

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  import { darkTheme } from '@thomasfosterau/charts';
</script>

<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke={darkTheme.colors.primary} />
</Chart>
```

### Theme Structure

Both themes follow this structure:

```typescript
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    grid: string;
    axis: string;
  };
  fonts: {
    family: string;
    size: {
      small: number;
      medium: number;
      large: number;
    };
  };
  stroke: {
    width: number;
  };
}
```

## Color Palettes

### Available Palettes

@thomasfosterau/charts includes several built-in color palettes:

- **default**: Professional, balanced colors
- **pastel**: Soft, muted colors
- **vibrant**: Bold, high-contrast colors
- **monochrome**: Grayscale colors

### Using Color Palettes

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  import { getColorFromPalette, colorPalettes } from '@thomasfosterau/charts';

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
      stroke={getColorFromPalette(colorPalettes.vibrant, i)}
    />
  {/each}
</Chart>
```

### Palette Colors

#### Default Palette
```javascript
['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac', '#ecc94b', '#ed64a6']
```

#### Pastel Palette
```javascript
['#a7c5eb', '#b4ddb4', '#f5c6a5', '#d4c5f9', '#f9b5ad', '#a4d4d9', '#f9e2ae', '#f5b8d4']
```

#### Vibrant Palette
```javascript
['#0077cc', '#00cc88', '#ff8800', '#7733ff', '#ff3366', '#00bbbb', '#ffcc00', '#ff0088']
```

#### Monochrome Palette
```javascript
['#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#dddddd', '#eeeeee', '#f9f9f9']
```

## Creating Custom Themes

### Full Custom Theme

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';

  const customTheme = {
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c',
      background: '#1a1a2e',
      surface: '#16213e',
      text: '#eee',
      textSecondary: '#aaa',
      border: '#0f3460',
      grid: 'rgba(255, 255, 255, 0.1)'
    },
    fonts: {
      base: 'Inter, system-ui, sans-serif',
      size: {
        small: 10,
        medium: 12,
        large: 16
      }
    },
    spacing: {
      small: 4,
      medium: 8,
      large: 16
    },
    borderRadius: 4,
    opacity: {
      disabled: 0.4,
      hover: 0.8
    }
  };
</script>

<Chart width={600} height={400} theme={customTheme}>
  <Line {data} x="x" y="y" stroke={customTheme.colors.primary} />
</Chart>
```

### Merging with Existing Theme

Extend the default theme with custom values:

```svelte
<script>
  import { mergeTheme } from '@thomasfosterau/charts';

  const myTheme = mergeTheme({
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4'
    },
    fonts: {
      family: 'Roboto, sans-serif'
    }
  });
</script>

<!-- Use theme colors in your components -->
<Chart width={600} height={400}>
  <Line {data} x="x" y="y" stroke={myTheme.colors.primary} />
</Chart>
```

## Styling Components

### Direct Color Props

Override colors directly on components:

```svelte
<script>
  import { Chart, Line, Bar, Scatter } from '@thomasfosterau/charts';
</script>

<Chart width={600} height={400}>
  <Line 
    {data} 
    x="x" 
    y="y" 
    stroke="#e53e3e"     <!-- Custom line color -->
    strokeWidth={3}      <!-- Custom line width -->
    fill="rgba(229, 62, 62, 0.2)" <!-- Fill under line -->
  />
</Chart>
```

### Component-Specific Styling

Each component accepts styling props:

#### Line Charts
```svelte
<Line 
  {data} 
  x="x" 
  y="y"
  stroke="#4299e1"
  strokeWidth={2}
  fill="rgba(66, 153, 225, 0.2)"
/>
```

#### Bar Charts
```svelte
<Bar 
  {data} 
  x="category" 
  y="value"
  fill="#48bb78"
  stroke="#2f855a"
  barWidth={0.8}
/>
```

#### Scatter Plots
```svelte
<Scatter 
  {data} 
  x="x" 
  y="y"
  radius={5}
  fill="#ed8936"
  stroke="#c05621"
/>
```

#### Pie Charts
```svelte
<Pie 
  {data} 
  valueKey="value" 
  labelKey="label"
  colors={['#4299e1', '#48bb78', '#ed8936', '#9f7aea']}
  innerRadius={0}
  showLabels={true}
/>
```

## Dynamic Theming

### Theme Switcher

```svelte
<script>
  import { Chart, Line } from '@thomasfosterau/charts';
  import { defaultTheme, darkTheme } from '@thomasfosterau/charts';

  let isDark = false;
  
  $: currentTheme = isDark ? darkTheme : defaultTheme;

  function toggleTheme() {
    isDark = !isDark;
  }
</script>

<button on:click={toggleTheme}>
  Toggle {isDark ? 'Light' : 'Dark'} Mode
</button>

<Chart width={600} height={400} theme={currentTheme}>
  <Line {data} x="x" y="y" stroke={currentTheme.colors.primary} />
</Chart>

<style>
  button {
    margin-bottom: 1rem;
  }
</style>
```

### System Preference

Respect user's system color scheme preference:

```svelte
<script>
  import { onMount } from 'svelte';
  import { defaultTheme, darkTheme } from '@thomasfosterau/charts';

  let theme = defaultTheme;

  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme
    theme = mediaQuery.matches ? darkTheme : defaultTheme;

    // Listen for changes
    const handler = (e) => {
      theme = e.matches ? darkTheme : defaultTheme;
    };

    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  });
</script>

<Chart width={600} height={400} {theme}>
  <Line {data} x="x" y="y" />
</Chart>
```

## Color Functions

### Generating Color Series

Create a function to generate colors for multiple series:

```svelte
<script>
  import { getColorFromPalette } from '@thomasfosterau/charts';

  function getSeriesColors(count, palette = 'default') {
    return Array.from({ length: count }, (_, i) => 
      getColorFromPalette(palette, i)
    );
  }

  const colors = getSeriesColors(5, 'vibrant');
  // ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd']
</script>
```

### Opacity Utilities

Add transparency to colors:

```javascript
function withOpacity(color, opacity) {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const semiTransparent = withOpacity('#4299e1', 0.5);
// 'rgba(66, 153, 225, 0.5)'
```

## Conditional Styling

### Data-Driven Colors

Color elements based on data values:

```svelte
<script>
  import { Chart, Bar } from '@thomasfosterau/charts';

  const data = [
    { category: 'A', value: 30 },
    { category: 'B', value: -15 },
    { category: 'C', value: 45 }
  ];

  function getBarColor(value) {
    return value >= 0 ? '#48bb78' : '#e53e3e';
  }
</script>

<Chart width={600} height={400}>
  {#each data as d}
    <Bar 
      data={[d]} 
      x="category" 
      y="value" 
      fill={getBarColor(d.value)}
    />
  {/each}
</Chart>
```

### Threshold-Based Colors

```javascript
function getColorByThreshold(value) {
  if (value < 30) return '#e53e3e';      // Red
  if (value < 70) return '#ed8936';      // Orange
  return '#48bb78';                       // Green
}
```

## Axis and Grid Styling

### Custom Axis Colors

```svelte
<script>
  const axisStyle = {
    stroke: '#718096',
    strokeWidth: 1,
    fill: '#2d3748'
  };
</script>

<Axis 
  scale={xScale} 
  type="x" 
  position="bottom"
  gridLines
  gridColor="rgba(113, 128, 150, 0.1)"
/>
```

### Grid Line Customization

```svelte
<Grid 
  xScale={xScale} 
  yScale={yScale}
  showX={true}
  showY={true}
  color="rgba(0, 0, 0, 0.05)"
  strokeWidth={1}
/>
```

## Accessibility

### High Contrast Mode

Provide a high-contrast theme for accessibility:

```javascript
const highContrastTheme = {
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#333333',
    border: '#000000',
    grid: '#cccccc'
  },
  // ... rest of theme
};
```

### Color Blind Friendly Palettes

Use color blind friendly color combinations:

```javascript
const colorBlindFriendly = [
  '#0173b2',  // Blue
  '#de8f05',  // Orange
  '#029e73',  // Green
  '#cc78bc',  // Purple
  '#ece133',  // Yellow
  '#56b4e9'   // Sky blue
];
```

## Best Practices

### 1. Consistent Color Meaning

Use consistent colors for similar data across charts:

```svelte
<script>
  const COLOR_SCHEMA = {
    revenue: '#48bb78',
    costs: '#e53e3e',
    profit: '#4299e1'
  };
</script>

<Chart width={600} height={400}>
  <Line data={revenueData} x="x" y="y" stroke={COLOR_SCHEMA.revenue} />
  <Line data={costsData} x="x" y="y" stroke={COLOR_SCHEMA.costs} />
</Chart>
```

### 2. Sufficient Contrast

Ensure text and lines have sufficient contrast:

```javascript
// Good: High contrast
stroke="#000000" on white background

// Bad: Low contrast
stroke="#e0e0e0" on white background
```

### 3. Limit Color Count

Don't use too many colors in a single chart:

```svelte
<!-- ✅ Good: 3-5 colors -->
<Chart>
  <Line data={data1} stroke="#4299e1" />
  <Line data={data2} stroke="#48bb78" />
  <Line data={data3} stroke="#ed8936" />
</Chart>

<!-- ❌ Bad: Too many colors -->
<Chart>
  <!-- 10+ different colored lines -->
</Chart>
```

### 4. Document Custom Themes

Comment your theme choices:

```javascript
const brandTheme = mergeTheme(defaultTheme, {
  colors: {
    primary: '#ff6b6b',    // Brand red
    secondary: '#4ecdc4',   // Brand teal
    // ... 
  }
});
```

### 5. Test in Different Modes

Always test your charts in both light and dark modes:

```svelte
<!-- Test both themes -->
<Chart theme={defaultTheme}>...</Chart>
<Chart theme={darkTheme}>...</Chart>
```

## Example: Complete Themed Dashboard

```svelte
<script>
  import { Chart, Line, Bar, Axis } from '@thomasfosterau/charts';
  import { darkTheme, getColorFromPalette } from '@thomasfosterau/charts';
  import { createScale, getNiceDomain } from '@thomasfosterau/charts';

  const lineData = [/* ... */];
  const barData = [/* ... */];

  const xScale = createScale('linear')
    .domain(getNiceDomain(lineData.map(d => d.x), 0))
    .range([50, 550]);

  const yScale = createScale('linear')
    .domain(getNiceDomain(lineData.map(d => d.y), 0.1))
    .range([360, 40]);

  const palette = 'vibrant';
</script>

<div class="dashboard">
  <h2>Revenue Trends</h2>
  
  <Chart width={600} height={400} theme={darkTheme}>
    <Line 
      data={lineData} 
      x="x" 
      y="y" 
      stroke={getColorFromPalette(palette, 0)}
      strokeWidth={2}
    />
    <Axis scale={xScale} type="x" position="bottom" label="Month" gridLines />
    <Axis scale={yScale} type="y" position="left" label="Revenue ($)" gridLines />
  </Chart>

  <h2>Category Performance</h2>
  
  <Chart width={600} height={400} theme={darkTheme}>
    {#each barData as d, i}
      <Bar 
        data={[d]} 
        x="category" 
        y="value" 
        fill={getColorFromPalette(palette, i)}
      />
    {/each}
    <Axis scale={xScale} type="x" position="bottom" />
    <Axis scale={yScale} type="y" position="left" gridLines />
  </Chart>
</div>

<style>
  .dashboard {
    background: #1a1a2e;
    color: #eee;
    padding: 2rem;
  }

  h2 {
    margin-bottom: 1rem;
  }
</style>
```

## Further Reading

- [Tutorial: Advanced Features](../tutorials/02-advanced-features.md)
- [D3 Color Documentation](https://github.com/d3/d3-color)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
