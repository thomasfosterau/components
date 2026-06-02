# Capability matrix

For every spec field and mark type, this records which interpreters honour it
and how it degrades when unsupported. This is the artifact that keeps multiple
interpreters honest and prevents the spec from drifting into web-only
assumptions.

**Status legend**

- ✅ — implemented
- 🔵 — planned, expected to be supported natively
- 🟡 — planned, supported with degradation (see notes)
- ⛔ — will not support; degradation behaviour is normative
- — — not applicable

**Interpreter columns**

- **TS core** — `@thomasfosterau/chart-core` (`computeContext`)
- **Vega-Lite** — the planned spec → Vega-Lite emitter (escape hatch / SSR fallback)
- **Swift Charts** — the planned Swift package (`ChartSpecKit`) decoding the spec into SwiftUI `ChartContent`
- **Compose** — the planned Kotlin/Android interpreter (charting approach not yet chosen; envelope may constrain further)
- **Media** — planned PDF / raster image / video targets (most likely built on the TS core)

## Marks

| Mark    | TS core | Vega-Lite           | Swift Charts   | Compose | Media | Degradation when unsupported            |
| ------- | ------- | ------------------- | -------------- | ------- | ----- | --------------------------------------- |
| `bar`   | ✅      | 🔵 `bar`            | 🔵 `BarMark`   | 🔵      | 🔵    | n/a — part of the portable intersection |
| `line`  | ✅      | 🔵 `line`           | 🔵 `LineMark`  | 🔵      | 🔵    | n/a — part of the portable intersection |
| `point` | ✅      | 🔵 `point`/`circle` | 🔵 `PointMark` | 🔵      | 🔵    | n/a — part of the portable intersection |
| `area`  | ✅      | 🔵 `area`           | 🔵 `AreaMark`  | 🔵      | 🔵    | n/a — part of the portable intersection |

The v1 mark set is deliberately the intersection of the native charting
vocabularies. New marks (e.g. `rect`, `rule`, `arc`) require a `specVersion`
bump and a row here **before** implementation.

## Encoding channels

| Field              | TS core                 | Vega-Lite | Swift Charts                       | Compose | Media | Degradation when unsupported                                            |
| ------------------ | ----------------------- | --------- | ---------------------------------- | ------- | ----- | ----------------------------------------------------------------------- |
| `encoding.x`       | ✅                      | 🔵        | 🔵 `.value(x:)`                    | 🔵      | 🔵    | Required for all v1 marks; a spec without `x`/`y` renders an empty plot |
| `encoding.y`       | ✅                      | 🔵        | 🔵 `.value(y:)`                    | 🔵      | 🔵    | Same as `x`                                                             |
| `encoding.color`   | ✅                      | 🔵        | 🔵 `.foregroundStyle(by:)`         | 🔵      | 🔵    | Ignored → single default series colour                                  |
| `encoding.size`    | ✅ point only           | 🔵        | 🟡 `.symbolSize(by:)` (point only) | 🟡      | 🔵    | Ignored → default mark size                                             |
| `encoding.opacity` | 🟡 parsed, not resolved | 🔵        | 🟡 limited                         | 🟡      | 🔵    | Ignored → fully opaque marks                                            |

## Encoding field types

| Type           | TS core             | Vega-Lite | Swift Charts              | Compose | Media | Notes                                                                                        |
| -------------- | ------------------- | --------- | ------------------------- | ------- | ----- | -------------------------------------------------------------------------------------------- |
| `quantitative` | ✅ linear scale     | 🔵        | 🔵 `Double` plottable     | 🔵      | 🔵    | Values must be finite JSON numbers                                                           |
| `temporal`     | ✅ UTC scale        | 🔵        | 🔵 `Date` plottable       | 🔵      | 🔵    | ISO 8601 strings or epoch ms; decoders reconstruct dates from the declared type, never sniff |
| `ordinal`      | ✅ band/point scale | 🔵        | 🟡 treated as categorical | 🟡      | 🔵    | Ordering is data order                                                                       |
| `nominal`      | ✅ band/point scale | 🔵        | 🔵 `String` plottable     | 🔵      | 🔵    |                                                                                              |

## Data

| Field                   | TS core          | Vega-Lite                      | Swift Charts         | Compose | Media | Degradation when unsupported                                        |
| ----------------------- | ---------------- | ------------------------------ | -------------------- | ------- | ----- | ------------------------------------------------------------------- |
| `data.values` (inline)  | ✅               | 🔵 inline `values`             | 🔵 decoded rows      | 🔵      | 🔵    | n/a                                                                 |
| `data.ref` kind `url`   | 🟡 host resolves | 🔵 `url`                       | 🔵 native fetch      | 🔵      | 🟡    | Interpreters that cannot fetch render an empty chart with the title |
| `data.ref` kind `query` | 🟡 host resolves | ⛔ host pre-resolves to values | 🟡 host app resolves | 🟡      | 🟡    | Host must resolve before handing to the interpreter                 |
| `data.ref` kind `node`  | 🟡 host resolves | ⛔ host pre-resolves to values | 🟡 host app resolves | 🟡      | 🟡    | Host must resolve before handing to the interpreter                 |

The TS core never resolves references itself: `computeContext` takes
already-resolved rows. Resolution is the host's/interpreter's job in every
language.

## Scales

| Field                                 | TS core | Vega-Lite         | Swift Charts                                  | Compose | Media | Degradation when unsupported                                                              |
| ------------------------------------- | ------- | ----------------- | --------------------------------------------- | ------- | ----- | ----------------------------------------------------------------------------------------- |
| `scales.x.domain` / `scales.y.domain` | ✅      | 🔵 `scale.domain` | 🟡 `chartXScale(domain:)`                     | 🟡      | 🔵    | Ignored → inferred from data extent                                                       |
| `scales.*.nice`                       | ✅      | 🔵 `scale.nice`   | ⛔ ignored (Swift Charts nices automatically) | 🟡      | 🔵    | Ignored → interpreter default                                                             |
| `scales.*.zero`                       | ✅      | 🔵 `scale.zero`   | ⛔ ignored                                    | 🟡      | 🔵    | Ignored → interpreter default (TS core defaults `zero: true` for bar y-scales regardless) |

## Config

| Field            | TS core                                                | Vega-Lite    | Swift Charts                                                 | Compose | Media                            | Degradation when unsupported     |
| ---------------- | ------------------------------------------------------ | ------------ | ------------------------------------------------------------ | ------- | -------------------------------- | -------------------------------- |
| `config.title`   | 🟡 passed through (rendering is the interpreter's job) | 🔵 `title`   | 🔵 SwiftUI label                                             | 🔵      | 🔵                               | Ignored → untitled chart         |
| `config.tooltip` | — (interaction is per-platform)                        | 🔵 `tooltip` | 🟡 maps to selection/`chartOverlay` if the app implements it | 🟡      | ⛔ static output has no tooltips | Ignored entirely; never an error |

## Extensions

| Field          | TS core                     | Vega-Lite  | Swift Charts | Compose    | Media | Degradation when unsupported                                                                                               |
| -------------- | --------------------------- | ---------- | ------------ | ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `extensions.*` | 🟡 passed through untouched | ⛔ ignored | ⛔ ignored   | ⛔ ignored | 🟡    | **Normative:** native interpreters must ignore the whole object. Web interpreters must render correctly when it is absent. |

## Spec versioning

| Field         | TS core             | Vega-Lite | Swift Charts           | Compose | Media | Behaviour                                                                                                            |
| ------------- | ------------------- | --------- | ---------------------- | ------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `specVersion` | ✅ enforced (`'1'`) | 🔵        | 🔵 enforced by decoder | 🔵      | 🔵    | Every interpreter must reject spec versions it does not understand, with a clear error — never best-effort rendering |

## Rules for changing this matrix

1. Every new spec field or mark gets a row here **in the same change** that adds it to the schema.
2. A field may only enter the portable (non-`extensions`) spec if Swift Charts **and** the chosen Compose approach can honour it or degrade from it gracefully.
3. Degradation behaviour is part of the contract: an interpreter that cannot honour a field must do what this matrix says, not improvise.
