#if canImport(Charts) && canImport(SwiftUI)
import Charts
import ChartSpec
import SwiftUI

// MARK: - Default renderer: Apple Swift Charts
//
// This is ONE possible renderer for the portable spec, kept in its own
// product so it can be replaced (e.g. by a Core Graphics, Metal, or
// third-party charting backend) without touching the ChartSpec decoder.

/// Renders a portable chart spec using Apple's Swift Charts framework.
@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
public struct ChartSpecView: View {
    // Note: the unqualified name resolves to the ChartSpec *struct* (types
    // shadow same-named modules in Swift), which is what we want here.
    private let spec: ChartSpec
    private let rows: [Datum]

    /// Creates a chart view.
    ///
    /// - Parameters:
    ///   - spec: The decoded portable chart spec.
    ///   - rows: Resolved data rows. Required when the spec's data is a
    ///     reference; defaults to the spec's inline values otherwise.
    public init(spec: ChartSpec, rows: [Datum]? = nil) {
        self.spec = spec
        switch spec.data {
        case .inline(let values):
            self.rows = rows ?? values
        case .ref:
            self.rows = rows ?? []
        }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let title = spec.config?.title {
                Text(title).font(.headline)
            }
            chart
        }
    }

    @ViewBuilder
    private var chart: some View {
        if spec.mark == .bar, let x = spec.encoding.x, let y = spec.encoding.y,
           let end = spec.encoding.x2 ?? spec.encoding.y2 {
            // Spec 1.1 range bars: x2 spans along x in y's bands, y2 along y in x's.
            let horizontal = spec.encoding.x2 != nil
            let along = horizontal ? x : y
            let band = horizontal ? y : x
            Chart {
                ForEach(Array(rangeRows(start: along, end: end, band: band).enumerated()), id: \.offset) { _, row in
                    rangeMark(row, horizontal: horizontal, alongLabel: along.field, bandLabel: band.field)
                }
            }
        } else if let x = spec.encoding.x, let y = spec.encoding.y {
            Chart {
                ForEach(Array(plottableRows(x: x, y: y).enumerated()), id: \.offset) { _, row in
                    markContent(x: row.x, y: row.y, colorCategory: row.color)
                }
            }
        } else {
            // Per the capability matrix: a spec without x/y renders an empty plot.
            Chart {}
        }
    }

    // MARK: Typed row extraction

    private struct PlottableRow {
        let x: TypedValue
        let y: TypedValue
        let color: String?
    }

    private func plottableRows(x: Channel, y: Channel) -> [PlottableRow] {
        rows.compactMap { datum -> PlottableRow? in
            // Rows whose values contradict declared types are skipped here;
            // host apps that want hard failures should validate before rendering.
            // Note: `try?` flattens the optional, so a thrown type violation and
            // a missing value both yield nil → the row is skipped either way.
            guard
                let xValue = try? x.typedValue(from: datum),
                let yValue = try? y.typedValue(from: datum)
            else { return nil }

            return PlottableRow(x: xValue, y: yValue, color: colorCategory(of: datum))
        }
    }

    private func colorCategory(of datum: Datum) -> String? {
        if let colorChannel = spec.encoding.color,
           case .categorical(let category)? = try? colorChannel.typedValue(from: datum) {
            return category
        }
        return nil
    }

    // MARK: Range bars (spec 1.1)

    /// A range's two ends, ordered low to high, in the one type both share.
    private enum RangeSpan {
        case temporal(Date, Date)
        case quantitative(Double, Double)
    }

    private struct RangeRow {
        let span: RangeSpan
        let band: String
        let color: String?
    }

    private func rangeRows(start: Channel, end: Channel, band: Channel) -> [RangeRow] {
        rows.compactMap { datum -> RangeRow? in
            guard
                let startValue = try? start.typedValue(from: datum),
                let endValue = try? end.typedValue(from: datum),
                case .categorical(let bandValue)? = try? band.typedValue(from: datum)
            else { return nil }

            // An end before its start is normalised, as in the TypeScript core.
            let span: RangeSpan
            switch (startValue, endValue) {
            case let (.temporal(from), .temporal(to)):
                span = .temporal(min(from, to), max(from, to))
            case let (.quantitative(from), .quantitative(to)):
                span = .quantitative(min(from, to), max(from, to))
            default:
                return nil
            }
            return RangeRow(span: span, band: bandValue, color: colorCategory(of: datum))
        }
    }

    @ChartContentBuilder
    private func rangeMark(_ row: RangeRow, horizontal: Bool, alongLabel: String, bandLabel: String) -> some ChartContent {
        let colorLabel = spec.encoding.color?.field ?? "series"
        switch (row.span, horizontal) {
        case let (.temporal(from, to), true):
            BarMark(xStart: .value(alongLabel, from), xEnd: .value(alongLabel, to), y: .value(bandLabel, row.band))
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: row.color)
        case let (.temporal(from, to), false):
            BarMark(x: .value(bandLabel, row.band), yStart: .value(alongLabel, from), yEnd: .value(alongLabel, to))
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: row.color)
        case let (.quantitative(from, to), true):
            BarMark(xStart: .value(alongLabel, from), xEnd: .value(alongLabel, to), y: .value(bandLabel, row.band))
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: row.color)
        case let (.quantitative(from, to), false):
            BarMark(x: .value(bandLabel, row.band), yStart: .value(alongLabel, from), yEnd: .value(alongLabel, to))
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: row.color)
        }
    }

    // MARK: Mark construction

    @ChartContentBuilder
    private func markContent(x: TypedValue, y: TypedValue, colorCategory: String?) -> some ChartContent {
        let xLabel = spec.encoding.x?.field ?? "x"
        let yLabel = spec.encoding.y?.field ?? "y"
        let colorLabel = spec.encoding.color?.field ?? "series"

        switch spec.mark {
        case .bar:
            buildMark(BarMarkBuilder.self, xLabel: xLabel, x: x, yLabel: yLabel, y: y)
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: colorCategory)
        case .line:
            buildMark(LineMarkBuilder.self, xLabel: xLabel, x: x, yLabel: yLabel, y: y)
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: colorCategory)
        case .point:
            buildMark(PointMarkBuilder.self, xLabel: xLabel, x: x, yLabel: yLabel, y: y)
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: colorCategory)
        case .area:
            buildMark(AreaMarkBuilder.self, xLabel: xLabel, x: x, yLabel: yLabel, y: y)
                .foregroundStyleIfPresent(colorLabel: colorLabel, category: colorCategory)
        }
    }

    private func buildMark<Builder: MarkBuilder>(
        _ builder: Builder.Type,
        xLabel: String,
        x: TypedValue,
        yLabel: String,
        y: TypedValue
    ) -> Builder.Output {
        // Swift Charts infers axis kinds from the static types of .value()
        // arguments, so each typed-value combination maps to a distinct call.
        switch (x, y) {
        case let (.quantitative(xv), .quantitative(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.temporal(xv), .quantitative(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.categorical(xv), .quantitative(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.quantitative(xv), .categorical(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.quantitative(xv), .temporal(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.temporal(xv), .temporal(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.temporal(xv), .categorical(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.categorical(xv), .temporal(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        case let (.categorical(xv), .categorical(yv)):
            return Builder.make(x: .value(xLabel, xv), y: .value(yLabel, yv))
        }
    }
}

// MARK: - Mark builders
//
// Small protocol shims so the typed-value dispatch above is written once
// rather than per mark type.

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
private protocol MarkBuilder {
    associatedtype Output: ChartContent
    static func make<X: Plottable, Y: Plottable>(
        x: PlottableValue<X>,
        y: PlottableValue<Y>
    ) -> Output
}

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
private enum BarMarkBuilder: MarkBuilder {
    static func make<X: Plottable, Y: Plottable>(x: PlottableValue<X>, y: PlottableValue<Y>) -> BarMark {
        BarMark(x: x, y: y)
    }
}

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
private enum LineMarkBuilder: MarkBuilder {
    static func make<X: Plottable, Y: Plottable>(x: PlottableValue<X>, y: PlottableValue<Y>) -> LineMark {
        LineMark(x: x, y: y)
    }
}

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
private enum PointMarkBuilder: MarkBuilder {
    static func make<X: Plottable, Y: Plottable>(x: PlottableValue<X>, y: PlottableValue<Y>) -> PointMark {
        PointMark(x: x, y: y)
    }
}

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
private enum AreaMarkBuilder: MarkBuilder {
    static func make<X: Plottable, Y: Plottable>(x: PlottableValue<X>, y: PlottableValue<Y>) -> AreaMark {
        AreaMark(x: x, y: y)
    }
}

// MARK: - Colour series support

@available(iOS 16.0, macOS 13.0, watchOS 9.0, tvOS 16.0, *)
extension ChartContent {
    @ChartContentBuilder
    fileprivate func foregroundStyleIfPresent(colorLabel: String, category: String?) -> some ChartContent {
        if let category {
            self.foregroundStyle(by: .value(colorLabel, category))
        } else {
            self
        }
    }
}
#endif
