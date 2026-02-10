# @thomasfosterau/charts Documentation

Welcome to the comprehensive documentation for @thomasfosterau/charts - a declarative Svelte charting library with multiple render targets.

## 📚 Table of Contents

### Getting Started
- [Getting Started Guide](./getting-started.md) - Installation, setup, and your first chart

### Tutorials
Step-by-step guides to help you learn the library:
- [Basic Charts](./tutorials/01-basic-charts.md) - Create line, bar, and scatter charts
- [Advanced Features](./tutorials/02-advanced-features.md) - Scales, axes, and theming
- [Custom Components](./tutorials/03-custom-components.md) - Build your own chart types

### Guides
In-depth explanations of key concepts:
- [Render Targets](./guides/render-targets.md) - SVG, Canvas, and WebGPU rendering
- [Scales and Domains](./guides/scales-and-domains.md) - Understanding D3 scales
- [Theming](./guides/theming.md) - Colors, styles, and custom themes
- [SSR Support](./guides/ssr.md) - Server-side rendering with SvelteKit

### API Reference
Complete reference for all components and utilities:
- [API Overview](./api/README.md) - Quick reference
- [Components](./api/components.md) - Chart, Line, Bar, Scatter, Area, Pie, Axis, Grid, Legend
- [Utilities](./api/utilities.md) - Scales, formatting, and helper functions
- [Renderers](./api/renderers.md) - SVG, Canvas, and WebGPU renderers

## 🚀 Quick Links

- [Main README](../README.md) - Project overview
- [Examples](../examples/README.md) - Code examples
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Features](../FEATURES.md) - Feature comparison and roadmap

## 🎯 What is @thomasfosterau/charts?

@thomasfosterau/charts is a modern charting library for Svelte that provides:

- **Multiple Render Targets**: Choose between SVG (SSR-compatible), Canvas (high-performance), or WebGPU (GPU-accelerated)
- **Pancake Coordinates**: Percentage-based coordinate system that works across all renderers
- **Declarative API**: Intuitive, component-based approach inspired by Swift Charts
- **Full TypeScript Support**: Type-safe development with excellent IDE support
- **D3-Powered Scales**: Leverage the power and flexibility of D3's scale system

## 🎨 Philosophy

This library is built on several core principles:

1. **Declarative First** - Charts should be as easy to describe as they are to understand
2. **SSR Compatible** - Works seamlessly with SvelteKit and server-side rendering
3. **Performance Matters** - Choose the right render target for your use case
4. **TypeScript Native** - Types are first-class citizens
5. **Svelte Optimized** - Built specifically for Svelte's reactivity model

## 📖 How to Use This Documentation

If you're new to the library, start with the [Getting Started Guide](./getting-started.md) to install and create your first chart.

Then work through the tutorials in order:
1. Learn basic chart types
2. Master advanced features like custom scales and theming
3. Create your own custom components

Refer to the guides when you need deeper understanding of specific concepts, and use the API reference as needed when building your charts.

## 🆘 Getting Help

- Check the [examples](../examples/README.md) for working code
- Review the [API reference](./api/README.md) for detailed component documentation
- Read the [guides](./guides/) for in-depth explanations
- Open an issue on [GitHub](https://github.com/thomasfosterau/charts/issues) if you find a bug or need help

## 📝 License

MIT © Thomas Foster
