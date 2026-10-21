# ChartSpecKit

Swift implementation of the portable chart specification — the native iOS / macOS / watchOS / tvOS interpreter of the cross-platform chart contract defined in [`schema/chart-spec.v1.json`](../../schema/chart-spec.v1.json).

## Products

| Product | What | Depend on it when |
| --- | --- | --- |
| **`ChartSpec`** | Codable structs mirroring the spec JSON, plus typed-value reconstruction (`Channel.typedValue(from:)`). Pure Foundation, no UI. | Always — this is the cross-language contract |
| **`ChartSpecCharts`** | A SwiftUI renderer built on Apple's Swift Charts (`ChartSpecView`). | You want the default renderer. **Swappable**: write your own renderer against `ChartSpec` instead (Core Graphics, Metal, a third-party charting library) without touching the decoder |

The split is deliberate: the decoder is the durable artifact; renderers are disposable relative to it. If Apple Swift Charts isn't the right backend for your app, implement another renderer against the same `ChartSpec` types.

## Usage

```swift
import ChartSpec
import ChartSpecCharts

// Decode a spec persisted by the CMS (ProseMirror document, API response, …)
let spec = try ChartSpec.decode(from: jsonData)

// Render with the default Swift Charts backend
var body: some View {
    ChartSpecView(spec: spec)
}

// Ref data: resolve rows in your app, then pass them in
ChartSpecView(spec: spec, rows: resolvedRows)
```

## Invariants (shared with every interpreter)

- **Typed values come from declared encoding types, never from sniffing JSON.** `Channel.typedValue(from:)` is the only way values become plottable.
- **`specVersion` is enforced**: unknown versions fail to decode rather than best-effort render.
- **Web-only `extensions` are ignored entirely** (the field isn't even declared in the Codable structs).
- **Data refs are resolved by the host app**, never by this package.

## Testing

```bash
cd packages/charts/swift/ChartSpecKit
swift test
```

The test suite mirrors the TypeScript spec tests (`packages/charts/tests/spec`): the same JSON documents must decode to equivalent values in both languages.

CI runs `swift test` on macOS whenever these sources or the schema change ([`.github/workflows/chartspeckit.yml`](../../../../.github/workflows/chartspeckit.yml)). The `ChartSpecCharts` renderer needs the iOS 16 / macOS 13 SDKs.
