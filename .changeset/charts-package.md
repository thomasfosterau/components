---
'@thomasfosterau/charts': minor
---

First release of `@thomasfosterau/charts`, merged in from the former `thomasfosterau/charts` repo, whose six unpublished packages become entries of this one:

- `@thomasfosterau/charts` (was `chart-spec`): the portable, renderer-agnostic chart spec — plain TypeScript types, `parseSpec` / `validateSpec` / `encodeSpec`, data guards. Effect Schema does the parsing internally and never appears in a published type.
- `@thomasfosterau/charts/schema.json`: the emitted JSON Schema (draft 2020-12), the cross-language contract. Every object now declares `additionalProperties: false`, matching what `parseSpec` already rejected.
- `@thomasfosterau/charts/core` (was `chart-core`): `computeContext(spec, box, data)` → scales, layout, geometry and ticks; no DOM.
- `@thomasfosterau/charts/react`, `/vue` (were `chart-react`, `chart-vue`): SSR-compatible SVG `Chart` components. `react` and `vue` are optional peers.
- `@thomasfosterau/charts/prosemirror` (was `chart-prosemirror`): the chart node spec and edit-time NodeView. `prosemirror-model` / `prosemirror-view` are optional peers.
- `@thomasfosterau/charts/vega` (was `chart-vega`): `emitVegaLite(spec)`, validated against the real Vega-Lite compiler.
