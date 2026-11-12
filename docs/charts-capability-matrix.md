# Capability matrix

The package overview is the [charts README](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md); the spec itself is described in [Chart spec](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-spec.md).

For every spec field and mark type, this records which interpreters honour it and how it degrades when unsupported. This is the artifact that keeps multiple interpreters honest and prevents the spec from drifting into web-only assumptions.

**Status legend**

- ✅ — implemented
- 🔵 — planned, expected to be supported natively
- 🟡 — planned, supported with degradation (see notes)
- ⛔ — will not support; degradation behaviour is normative
- — — not applicable

**Interpreter columns**

- **TS core** — `@thomasfosterau/charts/core` (`computeContext`). Web interpreters that sit on the core — the ProseMirror NodeView (`/prosemirror`) and the Svelte component (`/svelte`) — inherit this column.
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
| `tree` (spec 1.1) | ✅ tidy layout (`buildTreeGeometry`), plus a visually hidden nested list | ⛔ `VegaLiteEmitError` with reason `'unsupported-mark'` (Vega-Lite has no tree layout; use full Vega's `tree` transform or another interpreter) | 🟡 `TreeLayout` drawn on a SwiftUI `Canvas` outside Swift Charts, the hierarchy as accessibility children | 🟡 custom layout outside the charting library | 🔵 | Render the nested-list fallback (the hierarchy as text), never an empty plot |

The v1 mark set is deliberately the intersection of the native charting vocabularies. `tree` is the one exception (owner decision on #256): no native charting library has it, so every interpreter lays it out itself from the same algorithm, and the matrix rule 2 below is met by the nested-list degradation. New marks (e.g. `rect`, `rule`, `arc`) require a minor `specVersion` bump (see [§ Spec versioning](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-spec.md#spec-versioning)) and a row here **before** implementation.

### Text alternatives

| Feature | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| Data table (#304) | ✅ `buildDataTable` (in `resolveChart`'s `table`); the Svelte and ProseMirror interpreters render it visually hidden beside every chart, and visible in place of a newer `1.N` mark they do not know | ⛔ (Vega-Lite has its own `description` / ARIA; an unknown mark is rendered by a TS interpreter) | 🔵 the same model through `accessibilityChildren`, and as the fallback view | 🔵 | 🔵 | **Normative** for an unknown mark: render the table, never an empty plot |

### Encoding channels

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `encoding.x` | ✅ | ✅ | 🔵 `.value(x:)` | 🔵 | 🔵 | Required for all v1 marks; a spec without `x`/`y` renders an empty plot |
| `encoding.y` | ✅ | ✅ | 🔵 `.value(y:)` | 🔵 | 🔵 | Same as `x` |
| `encoding.x2` (spec 1.1) | ✅ range bars: each bar spans `x` to `x2` in `y`'s bands; an end before its start is normalised; the domain covers both ends and is not forced through zero | ✅ `x2` (field only; shares `x`'s type and scale) | 🔵 `BarMark(xStart:xEnd:y:)` | 🟡 floating bars via a custom column layer; where unavailable, a bar from the axis origin to `x2` | 🔵 | Only with `mark: "bar"` and an `x` of the same `quantitative` or `temporal` type (`parseSpec` rejects anything else). The Gantt / timeline basis |
| `encoding.y2` (spec 1.1) | ✅ vertical range bars, as `x2` | ✅ `y2` | 🔵 `BarMark(x:yStart:yEnd:)` | 🟡 as `x2` | 🔵 | As `x2`, on y |
| `encoding.id` / `encoding.parent` (spec 1.1) | ✅ `tree` only: `id` names each row (unique), `parent` names its parent's id (`null` for a root; several roots make a forest) | ⛔ (no `tree`) | 🟡 `TreeLayout` | 🟡 | 🔵 | Both required with `mark: "tree"` and rejected on every other mark; a `tree` takes no `x` / `y` / `x2` / `y2`. Row errors (duplicate id, unknown parent, cycle) are reported with the row number |
| `encoding.label` (spec 1.1) | ✅ `tree` only: the node text | ⛔ | 🟡 | 🟡 | 🔵 | Ignored → the node's id |
| `encoding.color` | ✅ | ✅ | 🔵 `.foregroundStyle(by:)` | 🔵 | 🔵 | Ignored → single default series colour |
| `encoding.size` | ✅ point only | ✅ | 🟡 `.symbolSize(by:)` (point only) | 🟡 | 🔵 | Ignored → default mark size |
| `encoding.opacity` | 🟡 parsed, not resolved | ✅ | 🟡 limited | 🟡 | 🔵 | Ignored → fully opaque marks |

### Mark options

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `tree.orientation` (spec 1.1) | ✅ `vertical` (roots on top, default) or `horizontal` (roots on the left) | ⛔ | 🟡 | 🟡 | 🔵 | Ignored → vertical |
| `tree.linkStyle` (spec 1.1) | ✅ `orthogonal` (default) or `curved` | ⛔ | 🟡 | 🟡 | 🔵 | Ignored → orthogonal |

`tree` is rejected on any mark other than `tree`.

### Encoding field types

| Type | TS core | Vega-Lite | Swift Charts | Compose | Media | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `quantitative` | ✅ linear scale | ✅ | 🔵 `Double` plottable | 🔵 | 🔵 | Values must be finite JSON numbers |
| `temporal` | ✅ UTC scale | ✅ | 🔵 `Date` plottable | 🔵 | 🔵 | ISO 8601 strings or epoch ms; decoders reconstruct dates from the declared type, never sniff |
| `ordinal` | ✅ band/point scale | ✅ | 🟡 treated as categorical | 🟡 | 🔵 | Ordering is data order; on `y`, the first category is at the top in every interpreter |
| `nominal` | ✅ band/point scale | ✅ | 🔵 `String` plottable | 🔵 | 🔵 | On `y`, the first category is at the top in every interpreter |

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
| `scales.*.zero` | ✅ | ✅ `scale.zero` | ⛔ ignored | 🟡 | 🔵 | Ignored → interpreter default (the TS core defaults `zero` to `true` on a bar chart's quantitative axes and `false` elsewhere; an explicit hint wins) |

### Config

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `config.title` | 🟡 not in `ChartContext`; the Svelte and ProseMirror interpreters draw it (rendering is the interpreter's job) | ✅ `title` | 🔵 SwiftUI label | 🔵 | 🔵 | Ignored → untitled chart |
| `config.tooltip` | — (interaction is per-platform) | ✅ `tooltip` | 🟡 maps to selection/`chartOverlay` if the app implements it | 🟡 | ⛔ static output has no tooltips | Ignored entirely; never an error |

### Extensions

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `extensions.*` | 🟡 passed through untouched | ⛔ ignored | ⛔ ignored | ⛔ ignored | 🟡 | **Normative:** native interpreters must ignore the whole object. Web interpreters must render correctly when it is absent. |

### Spec versioning

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Behaviour |
| --- | --- | --- | --- | --- | --- | --- |
| `specVersion` | ✅ `'1'` and `'1.1'` strictly; a newer `'1.N'` degraded | ✅ (the degraded spec) | 🔵 enforced by decoder (`.v1`, `.v1_1`); degrading a newer `1.N` not yet implemented | 🔵 | 🔵 | See the rule below |

The rule itself (what a minor version may change, how a newer `1.N` document degrades, and what is implemented) is [Spec versioning](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-spec.md#spec-versioning).

### Rules for changing this matrix

1. Every new spec field or mark gets a row here **in the same change** that adds it to the schema.
2. A field may only enter the portable (non-`extensions`) spec if Swift Charts **and** the chosen Compose approach can honour it or degrade from it gracefully.
3. Degradation behaviour is part of the contract: an interpreter that cannot honour a field must do what this matrix says, not improvise.
