# @thomasfosterau/charts - Internal Documentation

Welcome to the internal documentation for `@thomasfosterau/charts`. This directory contains comprehensive documentation about how the library works internally, design decisions, and comparisons with other charting libraries.

## Documentation Overview

### Architecture & Design
- **[Architecture](./architecture.md)** - Detailed explanation of the library's architecture and how all components fit together
- **[Pancake Coordinate System](./pancake-system.md)** - Deep dive into the percentage-based coordinate system
- **[Renderers](./renderers.md)** - How the renderer abstraction works and implementation details
- **[Design Decisions](./design-decisions.md)** - Alternative approaches considered and rationale for current design

### Comparisons & Context
- **[Library Comparisons](./comparisons.md)** - Detailed comparisons with libraries that inspired this project
- **[Performance](./performance.md)** - Performance characteristics, benchmarks, and optimization strategies

### Extending the Library
- **[Extending the Library](./extending.md)** - Guide for creating custom components, renderers, and chart types

## Quick Navigation

### For Contributors
If you're looking to contribute to the library:
1. Start with [Architecture](./architecture.md) to understand the overall structure
2. Read [Design Decisions](./design-decisions.md) to understand the philosophy
3. Check [Extending the Library](./extending.md) for implementation patterns

### For Users Creating Custom Components
If you want to build custom chart types:
1. Read [Pancake Coordinate System](./pancake-system.md) to understand the coordinate system
2. Study [Renderers](./renderers.md) to understand the renderer interface
3. Follow the guide in [Extending the Library](./extending.md)

### For Performance Optimization
If you're working with large datasets:
1. Read [Performance](./performance.md) for benchmarks and recommendations
2. Check [Renderers](./renderers.md) for renderer-specific optimizations

## External Documentation

For user-facing documentation, see:
- [README.md](../README.md) - Getting started guide
- [API.md](../API.md) - Complete API reference
- [FEATURES.md](../FEATURES.md) - Feature list and roadmap
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

## Philosophy

This library is built on several core principles:

1. **Declarative First** - Charts should be as easy to describe as they are to understand
2. **SSR Compatible** - No browser-only assumptions, works server-side
3. **Performance Matters** - Choose the right render target for your use case
4. **TypeScript Native** - Types are first-class citizens, not an afterthought
5. **Svelte Optimized** - Leverage Svelte's reactivity and component model
6. **Extensible** - Easy to create custom chart types and extend functionality

## Key Innovations

1. **Pancake Coordinate System** - Percentage-based coordinates (0-100) that are truly renderer-agnostic
2. **Multi-Target Rendering** - Same component works with SVG, Canvas, and WebGPU
3. **Context-Based Architecture** - Clean separation of concerns using Svelte contexts
4. **Scale System Integration** - Seamless integration with D3's powerful scale system

## Get Help

- **Issues**: [GitHub Issues](https://github.com/thomasfosterau/charts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thomasfosterau/charts/discussions)
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
