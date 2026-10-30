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

- 66fd7ad: Spec 1.1: add the `x2` / `y2` range channels. With `mark: "bar"`, each bar spans its start to its end, which is the basis of Gantt and timeline charts.

  - `SPEC_VERSION` is now `'1.1'`, and `'1'` specs stay valid. `parseSpec` rejects a range channel in a `'1'` spec, on a non-bar mark, or with a type that doesn't match its start channel.
  - The core draws horizontal and vertical range bars, normalising an end before its start.
  - The Vega-Lite emitter maps `x2` / `y2` straight across, and ChartSpecKit decodes and renders them with `BarMark(xStart:xEnd:y:)`.
  - The JSON Schema is regenerated, and the README records the minor-version rule.

- fd83f08: Add `@thomasfosterau/charts/svelte`, a Svelte 5 interpreter of the portable chart spec: a `Chart` component that renders the same SVG as the React and Vue ones, under `svelte/server` and on the client. It spreads native SVG attributes onto the `<svg>` (a caller's `aria-label` replaces the title-derived name) and takes a `fallback` snippet that receives the error message. It ships as `.svelte` source; `svelte` (^5.40.0) is a new optional peer.

  `@thomasfosterau/charts/core` gains `resolveChart(spec, box, data?, options?)` and its `ResolvedChart` result: validation plus `computeContext`, with every failure returned as a message instead of thrown. The React, Vue and Svelte `Chart` components are now built on it; their output and messages are unchanged.

- 66fd7ad: Add the `tree` mark (spec 1.1): `encoding.id`, `encoding.parent` and `encoding.label`, and `tree` options (`orientation`, `linkStyle`). The core lays a tree out tidily (`buildTreeGeometry`) and reports bad rows by number; the React, Vue, Svelte and ProseMirror interpreters draw it with a visually hidden nested-list text alternative beside the SVG (`renderTreeOutline`, `VISUALLY_HIDDEN_STYLE`, `outlineText`). `emitVegaLite` throws `VegaLiteEmitError` with the new `reason` `'unsupported-mark'` for a tree. ChartSpecKit decodes the mark and draws it with `TreeLayout` on a SwiftUI canvas.

### Patch Changes

- bbabaef: Doc comments name the package's own entries (`/core`) instead of the former `chart-core` package, and say what `computeDimensions` and `PositionalScale` actually do. The README gains an Install section with the optional peers per entry and a full API reference for every entry point, and its capability matrix's `zero` and `config.title` notes match the TypeScript core.
- c95bf52: Optional properties of the TypeScript-API types now accept an explicit `undefined`, so a wrapper can forward its own optional props under `exactOptionalPropertyTypes`: React `ChartProps`, `ComputeContextOptions.margins`, `ChartScales` / `ChartTicks`, the ProseMirror `ChartNodeViewOptions` / `ChartNodeSpecOptions`, `EmitVegaLiteOptions` and the line geometry's `pathOf`. Passing `undefined` behaves exactly like omitting the property. The chart spec and Vega-Lite document types keep key-optional members, matching the JSON Schema.
- d729e10: Drop the redundant `| undefined` the type-aware lint flagged on optional parameters and on `StaticMapRequest.overlay` (`unknown` already includes it), and quote the package names that opened the `@thomasfosterau/charts` entry modules' doc comments, which a JSDoc reader took for tags. The declared types are unchanged.
