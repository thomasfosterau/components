# @thomasfosterau/charts

A portable, renderer-agnostic charting system built around a durable chart
specification.

## Architecture

The system has three layers with different lifespans, languages, and owners.
**The persisted chart spec is the durable asset and the only cross-platform
contract.** Everything else is a per-platform interpreter of that spec.

| Layer                | What                                                                                                                                                                                     | Where                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **1 — Spec**         | Durable, declarative, language-neutral JSON chart description. Grammar-of-graphics level: mark + encodings + declared types + data reference. Never geometry, pixels, or renderer names. | [`packages/chart-spec`](./packages/chart-spec) + [`schema/chart-spec.v1.json`](./schema/chart-spec.v1.json) |
| **2 — Core**         | Pure, synchronous TypeScript. Turns `(spec, box, data)` into scales, dimensions, and geometry. No DOM, no reactivity, no rendering.                                                      | [`packages/chart-core`](./packages/chart-core)                                                              |
| **3 — Interpreters** | Per-platform renderers: ProseMirror NodeView, React, Vue, Vega-Lite, Swift, Svelte/SvelteKit, Kotlin/Compose, media targets. Each reads the spec and renders it idiomatically.           | `chart-prosemirror`, `chart-react`, `chart-vue`, `chart-vega`, `swift/ChartSpecKit`                         |

Only the spec (Layer 1) and its emitted JSON Schema may cross a language
boundary. Swift and Kotlin interpreters decode the same spec JSON; they never
consume the TypeScript core.

### Invariants

- The spec is grammar-level: no geometry, pixels, or renderer names in portable parts.
- Every encoding carries an explicit type (`quantitative` | `ordinal` | `nominal` | `temporal`).
- `specVersion` is present and respected by every interpreter.
- Interaction stays out of the portable spec beyond trivial hints (e.g. `tooltip`).
- The portable subset targets the intersection of native charting envelopes
  (Swift Charts, Compose); web-only richness lives in `extensions` and degrades gracefully.
- Effect Schema is a beta surface, isolated entirely inside `chart-spec`.

See [`docs/capability-matrix.md`](./docs/capability-matrix.md) for which
interpreters honour which spec fields.

## Example spec

```json
{
  "specVersion": "1",
  "mark": "line",
  "encoding": {
    "x": { "field": "date", "type": "temporal" },
    "y": { "field": "price", "type": "quantitative" }
  },
  "data": {
    "values": [
      { "date": "2024-01-01", "price": 150 },
      { "date": "2024-01-02", "price": 155.5 }
    ]
  },
  "config": { "title": "Stock price", "tooltip": true }
}
```

## Packages

| Package                                                             | Description                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`@thomasfosterau/chart-spec`](./packages/chart-spec)               | The portable chart spec: types, parse/validate/encode, JSON Schema emission                |
| [`@thomasfosterau/chart-core`](./packages/chart-core)               | Pure TS geometry core: `computeContext(spec, box, data)` → scales, layout, geometry, ticks |
| [`@thomasfosterau/chart-prosemirror`](./packages/chart-prosemirror) | ProseMirror integration: chart node schema + edit-time NodeView rendering SVG via the core |
| [`@thomasfosterau/chart-vega`](./packages/chart-vega)               | Spec → Vega-Lite emitter: escape hatch / SSR fallback, validated against the real compiler |
| [`@thomasfosterau/chart-react`](./packages/chart-react)             | React components: SSR-compatible SVG rendering via the core, hydration-safe                |
| [`@thomasfosterau/chart-vue`](./packages/chart-vue)                 | Vue 3 components: SSR-compatible SVG rendering via the core, plain render functions        |
| [`ChartSpecKit`](./swift/ChartSpecKit) (Swift)                      | Swift package: Codable spec decoder + swappable SwiftUI renderer (default: Swift Charts)   |

## Development

This is an npm workspace managed with [Vite+](https://viteplus.dev) (`vp`).

```bash
npm install        # install all workspace dependencies
npm test           # vp test — run all package tests (Vitest)
npm run check      # vp check — format, lint, and type check
npm run build      # build all packages (tsdown via vp pack)
npm run emit-schema  # regenerate schema/chart-spec.v1.json
```

The JSON Schema artifact at `schema/chart-spec.v1.json` is committed and kept
in sync by a test; if you change the spec schema, rerun `npm run emit-schema`.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets):

```bash
npm run changeset
```

## License

MIT © Thomas Foster
