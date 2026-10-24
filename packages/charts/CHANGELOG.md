# @thomasfosterau/charts

## 0.1.0

### Minor Changes

- 20a2dcd: First release of `@thomasfosterau/charts`, merged in from the former `thomasfosterau/charts` repo, whose six unpublished packages become entries of this one:

  - `@thomasfosterau/charts` (was `chart-spec`): the portable, renderer-agnostic chart spec — plain TypeScript types, `parseSpec` / `validateSpec` / `encodeSpec`, data guards. Effect Schema does the parsing internally and never appears in a published type.
  - `@thomasfosterau/charts/schema.json`: the emitted JSON Schema (draft 2020-12), the cross-language contract. Every object now declares `additionalProperties: false`, matching what `parseSpec` already rejected.
  - `@thomasfosterau/charts/core` (was `chart-core`): `computeContext(spec, box, data)` → scales, layout, geometry and ticks; no DOM.
  - `@thomasfosterau/charts/react`, `/vue` (were `chart-react`, `chart-vue`): SSR-compatible SVG `Chart` components. `react` and `vue` are optional peers.
  - `@thomasfosterau/charts/prosemirror` (was `chart-prosemirror`): the chart node spec and edit-time NodeView. `prosemirror-model` / `prosemirror-view` are optional peers.
  - `@thomasfosterau/charts/vega` (was `chart-vega`): `emitVegaLite(spec)`, validated against the real Vega-Lite compiler.

- fd83f08: Add `@thomasfosterau/charts/svelte`, a Svelte 5 interpreter of the portable chart spec: a `Chart` component that renders the same SVG as the React and Vue ones, under `svelte/server` and on the client. It spreads native SVG attributes onto the `<svg>` (a caller's `aria-label` replaces the title-derived name) and takes a `fallback` snippet that receives the error message. It ships as `.svelte` source; `svelte` (^5.40.0) is a new optional peer.

  `@thomasfosterau/charts/core` gains `resolveChart(spec, box, data?, options?)` and its `ResolvedChart` result: validation plus `computeContext`, with every failure returned as a message instead of thrown. The React, Vue and Svelte `Chart` components are now built on it; their output and messages are unchanged.

### Patch Changes

- bbabaef: Doc comments name the package's own entries (`/core`) instead of the former `chart-core` package, and say what `computeDimensions` and `PositionalScale` actually do. The README gains an Install section with the optional peers per entry and a full API reference for every entry point, and its capability matrix's `zero` and `config.title` notes match the TypeScript core.
- c95bf52: Optional properties of the TypeScript-API types now accept an explicit `undefined`, so a wrapper can forward its own optional props under `exactOptionalPropertyTypes`: React `ChartProps`, `ComputeContextOptions.margins`, `ChartScales` / `ChartTicks`, the ProseMirror `ChartNodeViewOptions` / `ChartNodeSpecOptions`, `EmitVegaLiteOptions` and the line geometry's `pathOf`. Passing `undefined` behaves exactly like omitting the property. The chart spec and Vega-Lite document types keep key-optional members, matching the JSON Schema.
