# Features

## Core Features

### ✅ Multiple Render Targets
- **SVG** - Perfect for SSR, static exports, and accessibility
- **Canvas** - High-performance for dynamic visualizations and large datasets
- **WebGPU** - GPU-accelerated rendering for complex visualizations (experimental)

### ✅ Pancake Coordinate System
- Percentage-based coordinates (0-100) instead of pixels
- Renderer-agnostic - same chart works across all render targets
- Simplifies responsive design and SSR compatibility

### ✅ Chart Types
- Line charts
- Bar charts (vertical)
- Scatter plots
- Area charts (filled line charts)
- Pie charts / Donut charts
- More coming soon: Heatmaps, Candlestick, Violin plots, etc.

### ✅ Components
- **Chart** - Root container with render target selection
- **Axis** - Customizable axes with ticks, labels, and grid lines
- **Grid** - Standalone grid component
- **Legend** - Configurable legend with multiple positions
- All chart type components (Line, Bar, Scatter, Area, Pie)

### ✅ Scale System
Built on D3's powerful scale system:
- Linear scales
- Logarithmic scales
- Time scales
- Band scales (for categorical data)
- Ordinal scales
- Point scales
- Power scales
- Square root scales

### ✅ Theming
- Default theme
- Dark theme
- Color palettes (default, pastel, vibrant, monochrome)
- Custom theme support
- Theme merging utilities

### ✅ Developer Experience
- Full TypeScript support
- Svelte 4 & 5 compatible
- Declarative API inspired by Swift Charts
- Comprehensive documentation
- Examples and guides

## Comparison with Other Libraries

| Feature | @thomasfosterau/charts | Chart.js | D3.js | Recharts | Victory |
|---------|----------------------|----------|-------|----------|---------|
| Svelte Native | ✅ | ❌ | ❌ | ❌ | ❌ |
| SSR Support | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| Canvas Rendering | ✅ | ✅ | ✅ | ❌ | ❌ |
| WebGPU Support | ✅ | ❌ | ❌ | ❌ | ❌ |
| Declarative API | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bundle Size | Small | Medium | Large | Medium | Large |
| Learning Curve | Low | Low | High | Low | Low |
| Customization | High | Medium | Very High | Medium | High |

## Roadmap

### Short Term (v0.x)
- [ ] Animation system
- [ ] Interaction handlers (hover, click, drag)
- [ ] More chart types (Heatmap, Candlestick)
- [ ] Zoom and pan support
- [ ] Tooltip component
- [ ] Responsive container
- [ ] Data transformation utilities

### Medium Term (v1.x)
- [ ] Advanced WebGPU implementation
- [ ] 3D chart support
- [ ] Real-time data streaming
- [ ] Advanced accessibility features (ARIA labels, keyboard navigation)
- [ ] Export to image/PDF
- [ ] Chart annotations
- [ ] Multiple y-axes support

### Long Term (v2.x+)
- [ ] Animation timeline editor
- [ ] Interactive chart builder
- [ ] Plugin system
- [ ] Advanced statistical visualizations
- [ ] GIS/mapping support
- [ ] Network/graph visualizations

## Inspiration

This library draws inspiration from:

- **Swift Charts** - Declarative API and composable architecture
- **D3.js** - Scale system and data transformation approach
- **Pancake Charts** - Percentage-based coordinate system for SSR
- **Chart.js** - Simple, intuitive API design
- **Observable Plot** - Grammar of graphics approach

## Philosophy

1. **Declarative First** - Charts should be as easy to describe as they are to understand
2. **SSR Compatible** - No browser-only assumptions, works server-side
3. **Performance Matters** - Choose the right render target for your use case
4. **TypeScript Native** - Types are first-class citizens, not an afterthought
5. **Svelte Optimized** - Leverage Svelte's reactivity and component model
6. **Extensible** - Easy to create custom chart types and extend functionality

## Known Limitations

### Current Version (0.x)
- WebGPU renderer is experimental and not feature-complete
- No built-in animations yet (coming soon)
- Limited interactivity (click/hover handlers coming soon)
- Pie chart rendering uses simplified arc algorithm
- Some edge cases with scales need refinement

### By Design
- Requires Svelte (not framework-agnostic)
- Focuses on 2D visualizations (3D planned for future)
- Uses D3 scales (dependency trade-off for power/flexibility)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Priority areas:
- Additional chart types
- Animation system
- Interaction handlers
- WebGPU renderer improvements
- Documentation and examples
- Test coverage

## License

MIT © Thomas Foster
