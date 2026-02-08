# Contributing to @thomasfosterau/charts

Thank you for your interest in contributing to this Svelte charting library! This document provides guidelines for contributing to the project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/thomasfosterau/charts.git
   cd charts
   ```

2. **Install dependencies**
   
   This project is designed to work with Bun, but npm also works:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Build the library**
   ```bash
   npm run build
   ```

4. **Run type checking**
   ```bash
   npm run check
   ```

## Project Structure

```
charts/
├── src/
│   └── lib/
│       ├── components/     # Svelte chart components
│       ├── core/          # Core context and utilities
│       ├── renderers/     # SVG, Canvas, WebGPU renderers
│       ├── scales/        # Scale utilities (D3-based)
│       ├── types/         # TypeScript type definitions
│       ├── utils/         # Helper functions
│       └── index.ts       # Main library export
├── examples/              # Usage examples
├── dist/                 # Build output (not committed)
└── .changeset/           # Changesets for versioning
```

## Architecture

### The Pancake Coordinate System

This library uses a "Pancake" coordinate system where all positions are specified as percentages (0-100) rather than pixels. This makes rendering device-independent and allows the same chart to work across SVG, Canvas, and WebGPU.

### Render Targets

The library supports three render targets:

1. **SVG** - Server-side rendering compatible, generates SVG markup
2. **Canvas** - High-performance Canvas API for dynamic visualizations
3. **WebGPU** - GPU-accelerated rendering (experimental)

All renderers implement the same `Renderer` interface, allowing components to work seamlessly across targets.

## Adding New Chart Types

To add a new chart type:

1. Create a new component in `src/lib/components/`
2. Import `getChartContext()` to access the renderer
3. Use the renderer's methods (beginPath, moveTo, lineTo, stroke, fill, etc.)
4. Work in Pancake coordinates (0-100 scale)
5. Export the component in `src/lib/components/index.ts`
6. Update the main `src/lib/index.ts` export

Example template:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getChartContext } from '../core/index.js';
  import type { DataPoint } from '../types/index.js';

  export let data: DataPoint[] = [];
  // ... other props

  const chartContext = getChartContext();
  const { renderer, width, height, margin } = chartContext;

  onMount(() => {
    draw();
  });

  function draw() {
    // Your rendering logic here
    // Use renderer.beginPath(), renderer.moveTo(), etc.
  }
</script>
```

## Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Use TypeScript for type safety
   - Keep components small and focused
   - Add JSDoc comments for public APIs

3. **Test your changes**
   ```bash
   npm run build
   npm run check
   ```

4. **Create a changeset**
   ```bash
   npm run changeset
   ```
   
   This will prompt you to describe your changes and specify the version bump type (major, minor, patch).

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

- Use tabs for indentation (configured in .prettierrc)
- Use single quotes for strings
- Follow TypeScript best practices
- Add type annotations for public APIs
- Keep line length under 100 characters

## Commit Message Convention

Follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

When you make changes:

1. Run `npm run changeset`
2. Select the type of change (major, minor, patch)
3. Describe your changes
4. Commit the changeset file along with your changes

## Adding Dependencies

Before adding a new dependency:

1. Check if it's really needed
2. Prefer lightweight libraries
3. Consider bundle size impact
4. Add to the appropriate section in package.json:
   - `dependencies` - Required at runtime
   - `devDependencies` - Only needed for development
   - `peerDependencies` - Should be provided by the user

## Questions?

If you have questions or need help, please:

1. Check the [README](./README.md) and [examples](./examples/)
2. Open an issue for discussion
3. Reach out to the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
