import Foundation
import XCTest
@testable import ChartSpec

/// Decoding tests mirroring the TypeScript chart-spec test suite: the same
/// JSON documents must decode to equivalent values in every language.
final class ChartSpecTests: XCTestCase {

    // MARK: Decoding valid specs

    func testDecodesLineSpecWithInlineData() throws {
        let json = """
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
        """.data(using: .utf8)!

        let spec = try ChartSpec.decode(from: json)
        XCTAssertEqual(spec.specVersion, .v1)
        XCTAssertEqual(spec.mark, .line)
        XCTAssertEqual(spec.encoding.x, Channel(field: "date", type: .temporal))
        XCTAssertEqual(spec.encoding.y, Channel(field: "price", type: .quantitative))
        XCTAssertEqual(spec.config?.title, "Stock price")
        XCTAssertEqual(spec.config?.tooltip, true)

        guard case .inline(let values) = spec.data else {
            return XCTFail("Expected inline data")
        }
        XCTAssertEqual(values.count, 2)
        XCTAssertEqual(values[0]["price"], .number(150))
        XCTAssertEqual(values[1]["price"], .number(155.5))
    }

    func testDecodesDataRef() throws {
        let json = """
        {
          "specVersion": "1",
          "mark": "bar",
          "encoding": {
            "x": { "field": "category", "type": "nominal" },
            "y": { "field": "count", "type": "quantitative" }
          },
          "data": { "ref": { "kind": "query", "id": "sales-by-region" } }
        }
        """.data(using: .utf8)!

        let spec = try ChartSpec.decode(from: json)
        guard case .ref(let ref) = spec.data else {
            return XCTFail("Expected ref data")
        }
        XCTAssertEqual(ref.kind, .query)
        XCTAssertEqual(ref.id, "sales-by-region")
    }

    func testDecodesScaleHints() throws {
        let json = """
        {
          "specVersion": "1",
          "mark": "line",
          "encoding": {
            "x": { "field": "x", "type": "quantitative" },
            "y": { "field": "y", "type": "quantitative" }
          },
          "data": { "values": [] },
          "scales": { "y": { "zero": true, "nice": true, "domain": [0, 200] } }
        }
        """.data(using: .utf8)!

        let spec = try ChartSpec.decode(from: json)
        XCTAssertEqual(spec.scales?.y?.zero, true)
        XCTAssertEqual(spec.scales?.y?.nice, true)
        XCTAssertEqual(spec.scales?.y?.domain, [.number(0), .number(200)])
    }

    func testIgnoresWebOnlyExtensions() throws {
        // Per the capability matrix, native interpreters ignore `extensions`.
        let json = """
        {
          "specVersion": "1",
          "mark": "point",
          "encoding": {
            "x": { "field": "a", "type": "quantitative" },
            "y": { "field": "b", "type": "quantitative" }
          },
          "data": { "values": [] },
          "extensions": { "preferredRenderer": "webgpu", "interactions": { "brush": true } }
        }
        """.data(using: .utf8)!

        let spec = try ChartSpec.decode(from: json)
        XCTAssertEqual(spec.mark, .point)
    }

    func testDecodesRangeBarSpecVersion1_1() throws {
        let json = """
        {
          "specVersion": "1.1",
          "mark": "bar",
          "encoding": {
            "y": { "field": "task", "type": "nominal" },
            "x": { "field": "start", "type": "temporal" },
            "x2": { "field": "end", "type": "temporal" }
          },
          "data": {
            "values": [
              { "task": "Sow tomatoes", "start": "2026-09-01", "end": "2026-10-15" }
            ]
          }
        }
        """.data(using: .utf8)!

        let spec = try ChartSpec.decode(from: json)
        XCTAssertEqual(spec.specVersion, .v1_1)
        XCTAssertEqual(spec.encoding.x2, Channel(field: "end", type: .temporal))
        XCTAssertNil(spec.encoding.y2)
    }

    // MARK: Rejecting invalid specs

    func testRejectsUnknownSpecVersion() {
        let json = """
        { "specVersion": "2", "mark": "bar", "encoding": {}, "data": { "values": [] } }
        """.data(using: .utf8)!
        XCTAssertThrowsError(try ChartSpec.decode(from: json))
    }

    func testRejectsUnknownMark() {
        let json = """
        { "specVersion": "1", "mark": "donut", "encoding": {}, "data": { "values": [] } }
        """.data(using: .utf8)!
        XCTAssertThrowsError(try ChartSpec.decode(from: json))
    }

    func testRejectsDataWithNeitherValuesNorRef() {
        let json = """
        { "specVersion": "1", "mark": "bar", "encoding": {}, "data": {} }
        """.data(using: .utf8)!
        XCTAssertThrowsError(try ChartSpec.decode(from: json))
    }

    // MARK: Round-trip

    func testEncodeDecodeRoundTrip() throws {
        let spec = ChartSpec(
            specVersion: .v1,
            mark: .bar,
            encoding: Encoding(
                x: Channel(field: "category", type: .nominal),
                y: Channel(field: "count", type: .quantitative)
            ),
            data: .inline([
                ["category": .string("a"), "count": .number(1)],
                ["category": .string("b"), "count": .number(2)],
            ]),
            config: Config(title: "Counts")
        )

        let restored = try ChartSpec.decode(from: spec.encodeJSON())
        XCTAssertEqual(restored, spec)
    }

    // MARK: Typed value reconstruction (the never-sniff invariant)

    func testQuantitativeValueReconstruction() throws {
        let channel = Channel(field: "price", type: .quantitative)
        XCTAssertEqual(
            try channel.typedValue(from: ["price": .number(42.5)]),
            .quantitative(42.5)
        )
        XCTAssertNil(try channel.typedValue(from: [:]))
        XCTAssertNil(try channel.typedValue(from: ["price": .null]))
        XCTAssertThrowsError(try channel.typedValue(from: ["price": .string("not a number")]))
    }

    func testTemporalValueReconstruction() throws {
        let channel = Channel(field: "date", type: .temporal)

        // Date-only ISO string → midnight UTC
        guard case .temporal(let dateOnly)? = try channel.typedValue(from: ["date": .string("2024-03-15")]) else {
            return XCTFail("Expected temporal value")
        }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let components = calendar.dateComponents([.year, .month, .day, .hour], from: dateOnly)
        XCTAssertEqual(components.year, 2024)
        XCTAssertEqual(components.month, 3)
        XCTAssertEqual(components.day, 15)
        XCTAssertEqual(components.hour, 0)

        // Full ISO timestamp
        guard case .temporal? = try channel.typedValue(from: ["date": .string("2024-03-15T12:30:00Z")]) else {
            return XCTFail("Expected temporal value")
        }

        // Epoch milliseconds
        guard case .temporal(let fromEpoch)? = try channel.typedValue(from: ["date": .number(1_704_067_200_000)]) else {
            return XCTFail("Expected temporal value")
        }
        XCTAssertEqual(fromEpoch.timeIntervalSince1970, 1_704_067_200)

        // Unparseable values throw — never silently sniffed into something else
        XCTAssertThrowsError(try channel.typedValue(from: ["date": .string("tomorrow-ish")]))
        XCTAssertThrowsError(try channel.typedValue(from: ["date": .bool(true)]))
    }

    func testCategoricalValueReconstruction() throws {
        let channel = Channel(field: "year", type: .ordinal)
        // Numeric categories stringify without a trailing ".0",
        // matching the TypeScript core.
        XCTAssertEqual(
            try channel.typedValue(from: ["year": .number(2024)]),
            .categorical("2024")
        )
        XCTAssertEqual(
            try channel.typedValue(from: ["year": .string("Q1")]),
            .categorical("Q1")
        )
        XCTAssertEqual(
            try channel.typedValue(from: ["year": .bool(true)]),
            .categorical("true")
        )
    }
}
