# Chart spec

The portable chart spec behind `@thomasfosterau/charts`: how the layers fit together, the invariants, worked example specs and the versioning rule. The package overview is the [charts README](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md); every exported symbol is in the [API reference](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-api.md); which interpreters honour which field is the [capability matrix](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-capability-matrix.md).

## Architecture

The system has three layers with different lifespans, languages, and owners. **The persisted chart spec is the durable asset and the only cross-platform contract.** Everything else is a per-platform interpreter of that spec.

| Layer | What | Where |
| --- | --- | --- |
| **1 — Spec** | Durable, declarative, language-neutral JSON chart description. Grammar-of-graphics level: mark + encodings + declared types + data reference. Never geometry, pixels, or renderer names. | [`@thomasfosterau/charts`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md#entry-points) + [`schema/chart-spec.v1.json`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/schema/chart-spec.v1.json) |
| **2 — Core** | Pure, synchronous TypeScript. Turns `(spec, box, data)` into scales, dimensions, and geometry. No DOM, no reactivity, no rendering. | [`@thomasfosterau/charts/core`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md#entry-points) |
| **3 — Interpreters** | Per-platform renderers: ProseMirror NodeView, Vega-Lite, Swift, Svelte/SvelteKit, Kotlin/Compose, media targets. Each reads the spec and renders it idiomatically. | `/prosemirror`, `/svelte`, `/vega`, [`swift/ChartSpecKit`](https://github.com/thomasfosterau/components/tree/trunk/packages/charts/swift/ChartSpecKit) |

Only the spec (Layer 1) and its emitted JSON Schema may cross a language boundary. Swift and Kotlin interpreters decode the same spec JSON; they never consume the TypeScript core.

### Invariants

- The spec is grammar-level: no geometry, pixels, or renderer names in portable parts.
- Every encoding carries an explicit type (`quantitative` | `ordinal` | `nominal` | `temporal`).
- `specVersion` is present and respected by every interpreter.
- Interaction stays out of the portable spec beyond trivial hints (e.g. `tooltip`).
- The portable subset targets the intersection of native charting envelopes (Swift Charts, Compose); web-only richness lives in `extensions` and degrades gracefully.
- Effect Schema is an implementation detail of the spec entry: no published `.d.mts` names `effect`, and the build fails if one does.

See the [capability matrix](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-capability-matrix.md) for which interpreters honour which spec fields.

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

### Example: a planting-calendar Gantt (spec 1.1)

A range bar is a `bar` with an end channel: one row per task (`y`), a bar from its start (`x`) to its end (`x2`).

```json
{
  "specVersion": "1.1",
  "mark": "bar",
  "encoding": {
    "y": { "field": "task", "type": "nominal" },
    "x": { "field": "start", "type": "temporal" },
    "x2": { "field": "end", "type": "temporal" },
    "color": { "field": "bed", "type": "nominal" }
  },
  "data": {
    "values": [
      { "task": "Sow tomatoes", "start": "2026-09-01", "end": "2026-10-15", "bed": "Glasshouse" },
      { "task": "Transplant", "start": "2026-10-15", "end": "2026-11-01", "bed": "North bed" },
      { "task": "Harvest", "start": "2026-12-20", "end": "2027-03-01", "bed": "North bed" }
    ]
  },
  "config": { "title": "Planting calendar" }
}
```

The first task is the top row in every interpreter. `ganttSpec` builds the same shape from plain rows, sorting them by start and listing the tasks in that order in `scales.y.domain`:

```ts
import { ganttSpec } from '@thomasfosterau/charts';

const spec = ganttSpec(rows, {
  task: 'task',
  start: 'start',
  end: 'end',
  group: 'bed',
  title: 'Planting calendar',
});
```

### Example: a plant taxonomy (spec 1.1)

A `tree` draws one node per row, joined to the row its `parent` names (`null` for a root). Nodes are laid out tidily: leaves in depth-first order, each parent centred over its children.

```json
{
  "specVersion": "1.1",
  "mark": "tree",
  "encoding": {
    "id": { "field": "id", "type": "nominal" },
    "parent": { "field": "parent", "type": "nominal" },
    "label": { "field": "name", "type": "nominal" },
    "color": { "field": "rank", "type": "nominal" }
  },
  "data": {
    "values": [
      { "id": "solanaceae", "parent": null, "name": "Solanaceae", "rank": "Family" },
      { "id": "solanum", "parent": "solanaceae", "name": "Solanum", "rank": "Genus" },
      { "id": "tomato", "parent": "solanum", "name": "S. lycopersicum", "rank": "Species" },
      { "id": "capsicum", "parent": "solanaceae", "name": "Capsicum", "rank": "Genus" }
    ]
  },
  "tree": { "orientation": "vertical", "linkStyle": "orthogonal" },
  "config": { "title": "Nightshades" }
}
```

Every interpreter also renders the hierarchy as a visually hidden nested list beside the SVG, so assistive technology reads the tree's structure rather than a flat picture.

## Spec versioning

The per-interpreter status of this rule is the `specVersion` row of the [capability matrix](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-capability-matrix.md#spec-versioning).

- **A minor version only adds.** Every `'1'` spec is a valid `'1.1'` spec and renders the same. New channels and marks come in a minor version and need a row in this matrix first. `'1.1'` adds `encoding.x2` / `encoding.y2`, the `tree` mark with its `id` / `parent` / `label` channels and `tree` options, and `parseSpec` rejects all of them in a `'1'` spec.
- **Degradation across minors is defined:** an interpreter given a newer `1.x` spec ignores channels it does not know, and renders a mark it does not know through the data-table fallback, never an empty plot. A new major version is a break, and an interpreter rejects it with a clear error.
- **What is implemented (#304):** `parseSpec` / `validateSpec` read `'1'` and `'1.1'` strictly, as before. A `specVersion` of the form `'1.N'` with N above 1 (no leading zero) is read as `'1.1'`: unknown keys anywhere are ignored and listed in the result's `degradation.ignored` with the declared version, the value's `specVersion` is `'1.1'` (so `encodeSpec` writes the known subset, not the original), and the 1.1 rules still hold for what it knows. An unknown `mark` fails validation with an error naming it and carries `unsupported` (`parseSpec` throws `UnsupportedMarkError`); `resolveChart` turns it into an `unsupported` outcome, which the Svelte and ProseMirror interpreters render as a visible data table. `'2'`, `'2.0'` and malformed versions are rejected.
- **The JSON Schema stays strict** (owner decision on #304): `chart-spec.v1.json` describes only the versions it knows and closes every object, so validators keep catching typos. Only the parsers degrade.
- **Interpreters that cannot degrade:** 0.1.0, the first release, shipped strict: it rejects any version above `'1.1'`, so the rule holds only for releases from this one on. ChartSpecKit's decoder does not degrade yet.
