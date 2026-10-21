# @thomasfosterau/charts

A portable, renderer-agnostic charting system built around a durable chart specification: the spec and its JSON Schema, a pure TypeScript geometry core, and interpreters for React, Vue, ProseMirror and Vega-Lite — plus a Swift package, [`ChartSpecKit`](./swift/ChartSpecKit), that decodes the same JSON.

This package is not a Svelte component. The Svelte chart in this workspace is `Chart` from [`@thomasfosterau/components/charts`](../components/README.md), which takes its own series props rather than this spec.

```sh
pnpm add @thomasfosterau/charts
```

## Architecture

The system has three layers with different lifespans, languages, and owners. **The persisted chart spec is the durable asset and the only cross-platform contract.** Everything else is a per-platform interpreter of that spec.

| Layer | What | Where |
| --- | --- | --- |
| **1 — Spec** | Durable, declarative, language-neutral JSON chart description. Grammar-of-graphics level: mark + encodings + declared types + data reference. Never geometry, pixels, or renderer names. | [`@thomasfosterau/charts`](#entry-points) + [`schema/chart-spec.v1.json`](./schema/chart-spec.v1.json) |
| **2 — Core** | Pure, synchronous TypeScript. Turns `(spec, box, data)` into scales, dimensions, and geometry. No DOM, no reactivity, no rendering. | [`@thomasfosterau/charts/core`](#entry-points) |
| **3 — Interpreters** | Per-platform renderers: ProseMirror NodeView, React, Vue, Vega-Lite, Swift, Svelte/SvelteKit, Kotlin/Compose, media targets. Each reads the spec and renders it idiomatically. | `/prosemirror`, `/react`, `/vue`, `/vega`, [`swift/ChartSpecKit`](./swift/ChartSpecKit) |

Only the spec (Layer 1) and its emitted JSON Schema may cross a language boundary. Swift and Kotlin interpreters decode the same spec JSON; they never consume the TypeScript core.

### Invariants

- The spec is grammar-level: no geometry, pixels, or renderer names in portable parts.
- Every encoding carries an explicit type (`quantitative` | `ordinal` | `nominal` | `temporal`).
- `specVersion` is present and respected by every interpreter.
- Interaction stays out of the portable spec beyond trivial hints (e.g. `tooltip`).
- The portable subset targets the intersection of native charting envelopes (Swift Charts, Compose); web-only richness lives in `extensions` and degrades gracefully.
- Effect Schema is an implementation detail of the spec entry: no published `.d.mts` names `effect`, and the build fails if one does.

See [§ Capability matrix](#capability-matrix) for which interpreters honour which spec fields.

## Entry points

Each layer is its own entry, so a consumer loads only the interpreter it uses. The frameworks are **optional** peers: install the one your entry needs.

| Entry | What | Peer to install |
| --- | --- | --- |
| `@thomasfosterau/charts` | The portable spec: types, `parseSpec` / `validateSpec` / `encodeSpec`, `SpecValidationError`, data guards | — |
| `@thomasfosterau/charts/core` | Pure TS geometry core: `computeContext(spec, box, data)` → scales, layout, geometry, ticks | — |
| `@thomasfosterau/charts/prosemirror` | ProseMirror integration: chart node schema + edit-time NodeView rendering SVG via the core | `prosemirror-model`, `prosemirror-view` |
| `@thomasfosterau/charts/react` | React components: SSR-compatible SVG rendering via the core, hydration-safe | `react` (18 or 19) |
| `@thomasfosterau/charts/vue` | Vue 3 components: SSR-compatible SVG rendering via the core, plain render functions | `vue` (3.3+) |
| `@thomasfosterau/charts/vega` | Spec → Vega-Lite emitter: escape hatch / SSR fallback, validated against the real compiler | — (emits a plain object; bring your own `vega-embed`) |
| `@thomasfosterau/charts/schema.json` | The JSON Schema artifact (draft 2020-12), for codegen and non-TS validators | — |

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

## Capability matrix

For every spec field and mark type, this records which interpreters honour it and how it degrades when unsupported. This is the artifact that keeps multiple interpreters honest and prevents the spec from drifting into web-only assumptions.

**Status legend**

- ✅ — implemented
- 🔵 — planned, expected to be supported natively
- 🟡 — planned, supported with degradation (see notes)
- ⛔ — will not support; degradation behaviour is normative
- — — not applicable

**Interpreter columns**

- **TS core** — `@thomasfosterau/charts/core` (`computeContext`). Web interpreters that sit on the core — the ProseMirror NodeView (`/prosemirror`), the React components (`/react`), the Vue components (`/vue`), and the planned Svelte interpreter — inherit this column.
- **Vega-Lite** — `@thomasfosterau/charts/vega` (`emitVegaLite`), the spec → Vega-Lite emitter (escape hatch / SSR fallback), validated against the real Vega-Lite compiler
- **Swift Charts** — `swift/ChartSpecKit`: the `ChartSpec` Codable decoder plus a swappable SwiftUI renderer whose default backend is Apple Swift Charts. Compiled and tested in CI (`.github/workflows/chartspeckit.yml`); renderer statuses stay 🔵 until each is verified on device
- **Compose** — the planned Kotlin/Android interpreter (charting approach not yet chosen; envelope may constrain further)
- **Media** — planned PDF / raster image / video targets (most likely built on the TS core)

### Marks

| Mark | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `bar` | ✅ | ✅ `bar` | 🔵 `BarMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `line` | ✅ | ✅ `line` | 🔵 `LineMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `point` | ✅ | ✅ `point`/`circle` | 🔵 `PointMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `area` | ✅ | ✅ `area` | 🔵 `AreaMark` | 🔵 | 🔵 | n/a — part of the portable intersection |

The v1 mark set is deliberately the intersection of the native charting vocabularies. New marks (e.g. `rect`, `rule`, `arc`) require a `specVersion` bump and a row here **before** implementation.

### Encoding channels

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `encoding.x` | ✅ | ✅ | 🔵 `.value(x:)` | 🔵 | 🔵 | Required for all v1 marks; a spec without `x`/`y` renders an empty plot |
| `encoding.y` | ✅ | ✅ | 🔵 `.value(y:)` | 🔵 | 🔵 | Same as `x` |
| `encoding.color` | ✅ | ✅ | 🔵 `.foregroundStyle(by:)` | 🔵 | 🔵 | Ignored → single default series colour |
| `encoding.size` | ✅ point only | ✅ | 🟡 `.symbolSize(by:)` (point only) | 🟡 | 🔵 | Ignored → default mark size |
| `encoding.opacity` | 🟡 parsed, not resolved | ✅ | 🟡 limited | 🟡 | 🔵 | Ignored → fully opaque marks |

### Encoding field types

| Type | TS core | Vega-Lite | Swift Charts | Compose | Media | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `quantitative` | ✅ linear scale | ✅ | 🔵 `Double` plottable | 🔵 | 🔵 | Values must be finite JSON numbers |
| `temporal` | ✅ UTC scale | ✅ | 🔵 `Date` plottable | 🔵 | 🔵 | ISO 8601 strings or epoch ms; decoders reconstruct dates from the declared type, never sniff |
| `ordinal` | ✅ band/point scale | ✅ | 🟡 treated as categorical | 🟡 | 🔵 | Ordering is data order |
| `nominal` | ✅ band/point scale | ✅ | 🔵 `String` plottable | 🔵 | 🔵 |  |

### Data

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `data.values` (inline) | ✅ | ✅ inline `values` | 🔵 decoded rows | 🔵 | 🔵 | n/a |
| `data.ref` kind `url` | 🟡 host resolves | ✅ `url` | 🔵 native fetch | 🔵 | 🟡 | Interpreters that cannot fetch render an empty chart with the title |
| `data.ref` kind `query` | 🟡 host resolves | ⛔ host pre-resolves to values | 🟡 host app resolves | 🟡 | 🟡 | Host must resolve before handing to the interpreter |
| `data.ref` kind `node` | 🟡 host resolves | ⛔ host pre-resolves to values | 🟡 host app resolves | 🟡 | 🟡 | Host must resolve before handing to the interpreter |

The TS core never resolves references itself: `computeContext` takes already-resolved rows. Resolution is the host's/interpreter's job in every language.

### Scales

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `scales.x.domain` / `scales.y.domain` | ✅ | ✅ `scale.domain` | 🟡 `chartXScale(domain:)` | 🟡 | 🔵 | Ignored → inferred from data extent |
| `scales.*.nice` | ✅ | ✅ `scale.nice` | ⛔ ignored (Swift Charts nices automatically) | 🟡 | 🔵 | Ignored → interpreter default |
| `scales.*.zero` | ✅ | ✅ `scale.zero` | ⛔ ignored | 🟡 | 🔵 | Ignored → interpreter default (TS core defaults `zero: true` for bar y-scales regardless) |

### Config

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `config.title` | 🟡 passed through (rendering is the interpreter's job) | ✅ `title` | 🔵 SwiftUI label | 🔵 | 🔵 | Ignored → untitled chart |
| `config.tooltip` | — (interaction is per-platform) | ✅ `tooltip` | 🟡 maps to selection/`chartOverlay` if the app implements it | 🟡 | ⛔ static output has no tooltips | Ignored entirely; never an error |

### Extensions

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `extensions.*` | 🟡 passed through untouched | ⛔ ignored | ⛔ ignored | ⛔ ignored | 🟡 | **Normative:** native interpreters must ignore the whole object. Web interpreters must render correctly when it is absent. |

### Spec versioning

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Behaviour |
| --- | --- | --- | --- | --- | --- | --- |
| `specVersion` | ✅ enforced (`'1'`) | ✅ | 🔵 enforced by decoder | 🔵 | 🔵 | Every interpreter must reject spec versions it does not understand, with a clear error — never best-effort rendering |

### Rules for changing this matrix

1. Every new spec field or mark gets a row here **in the same change** that adds it to the schema.
2. A field may only enter the portable (non-`extensions`) spec if Swift Charts **and** the chosen Compose approach can honour it or degrade from it gracefully.
3. Degradation behaviour is part of the contract: an interpreter that cannot honour a field must do what this matrix says, not improvise.

## Development

From the workspace root (see the [root README](../../README.md) for setup):

```sh
vp run --filter ./packages/charts test:unit    # Vitest under Node (happy-dom where a suite mounts)
vp run --filter ./packages/charts check        # tsc, plus the DOM-free re-check of spec + core
vp run --filter ./packages/charts build        # vp pack -> dist/, then the Effect-leak check
vp run --filter ./packages/charts emit-schema  # regenerate schema/chart-spec.v1.json
```

The JSON Schema artifact at `schema/chart-spec.v1.json` is committed and kept in sync by a test; if you change the spec schema, rerun `emit-schema` and commit the result. The Swift package is tested by its own workflow (`swift test` in `swift/ChartSpecKit`, on macOS).

## License

MIT © Thomas Foster
