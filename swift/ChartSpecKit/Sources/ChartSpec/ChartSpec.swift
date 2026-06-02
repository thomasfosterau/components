import Foundation

// MARK: - Portable chart specification (Layer 1)
//
// Codable structs mirroring the language-neutral JSON Schema at
// schema/chart-spec.v1.json. These types are the only thing shared with the
// TypeScript and Kotlin worlds; no code crosses the language boundary, only
// the spec schema does.

/// The portable chart spec version this package understands.
public enum SpecVersion: String, Codable, Equatable, Sendable {
    case v1 = "1"
}

/// The mark (geometric primitive) used to render the chart.
public enum Mark: String, Codable, Equatable, Sendable {
    case bar
    case line
    case point
    case area
}

/// The declared type of an encoded field.
///
/// Interpreters reconstruct typed plottable values from these declarations —
/// never by sniffing JSON runtime values.
public enum FieldType: String, Codable, Equatable, Sendable {
    case quantitative
    case ordinal
    case nominal
    case temporal
}

/// A mapping from a data field to a visual channel, with an explicit type.
public struct Channel: Codable, Equatable, Sendable {
    public let field: String
    public let type: FieldType

    public init(field: String, type: FieldType) {
        self.field = field
        self.type = type
    }
}

/// Field-to-channel mappings.
public struct Encoding: Codable, Equatable, Sendable {
    public let x: Channel?
    public let y: Channel?
    public let color: Channel?
    public let size: Channel?
    public let opacity: Channel?

    public init(
        x: Channel? = nil,
        y: Channel? = nil,
        color: Channel? = nil,
        size: Channel? = nil,
        opacity: Channel? = nil
    ) {
        self.x = x
        self.y = y
        self.color = color
        self.size = size
        self.opacity = opacity
    }
}

/// A single value inside a data row: a flat JSON primitive.
public enum DatumValue: Codable, Equatable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else if let string = try? container.decode(String.self) {
            self = .string(string)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Datum values must be JSON primitives (string, number, bool, or null)"
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

/// A single data row.
public typealias Datum = [String: DatumValue]

/// The kind of an external data reference.
public enum DataRefKind: String, Codable, Equatable, Sendable {
    case query
    case node
    case url
}

/// A reference to an externally stored dataset, resolved by the host app.
public struct DataRef: Codable, Equatable, Sendable {
    public let kind: DataRefKind
    public let id: String

    public init(kind: DataRefKind, id: String) {
        self.kind = kind
        self.id = id
    }
}

/// The chart's data: exactly one of inline values or an external reference.
public enum ChartData: Codable, Equatable, Sendable {
    case inline([Datum])
    case ref(DataRef)

    private enum CodingKeys: String, CodingKey {
        case values
        case ref
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if container.contains(.values) {
            self = .inline(try container.decode([Datum].self, forKey: .values))
        } else if container.contains(.ref) {
            self = .ref(try container.decode(DataRef.self, forKey: .ref))
        } else {
            throw DecodingError.dataCorrupted(DecodingError.Context(
                codingPath: decoder.codingPath,
                debugDescription: "Chart data must contain either 'values' or 'ref'"
            ))
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .inline(let values): try container.encode(values, forKey: .values)
        case .ref(let ref): try container.encode(ref, forKey: .ref)
        }
    }
}

/// A scale domain entry: a number or a string (ISO date / category).
public enum DomainValue: Codable, Equatable, Sendable {
    case number(Double)
    case string(String)

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let number = try? container.decode(Double.self) {
            self = .number(number)
        } else if let string = try? container.decode(String.self) {
            self = .string(string)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Domain values must be numbers or strings"
            )
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .number(let value): try container.encode(value)
        case .string(let value): try container.encode(value)
        }
    }
}

/// Optional per-scale hints. Interpreters may infer or override these.
public struct ScaleHint: Codable, Equatable, Sendable {
    public let domain: [DomainValue]?
    public let nice: Bool?
    public let zero: Bool?

    public init(domain: [DomainValue]? = nil, nice: Bool? = nil, zero: Bool? = nil) {
        self.domain = domain
        self.nice = nice
        self.zero = zero
    }
}

/// Per-channel scale hints.
public struct Scales: Codable, Equatable, Sendable {
    public let x: ScaleHint?
    public let y: ScaleHint?

    public init(x: ScaleHint? = nil, y: ScaleHint? = nil) {
        self.x = x
        self.y = y
    }
}

/// Portable presentation hints.
public struct Config: Codable, Equatable, Sendable {
    public let title: String?
    public let tooltip: Bool?

    public init(title: String? = nil, tooltip: Bool? = nil) {
        self.title = title
        self.tooltip = tooltip
    }
}

/// The portable chart specification (Layer 1).
///
/// Note: the spec's web-only `extensions` field is intentionally absent.
/// Per the capability matrix, native interpreters must ignore it entirely —
/// Codable does this for free by not declaring the key.
public struct ChartSpec: Codable, Equatable, Sendable {
    public let specVersion: SpecVersion
    public let mark: Mark
    public let encoding: Encoding
    public let data: ChartData
    public let scales: Scales?
    public let config: Config?

    public init(
        specVersion: SpecVersion,
        mark: Mark,
        encoding: Encoding,
        data: ChartData,
        scales: Scales? = nil,
        config: Config? = nil
    ) {
        self.specVersion = specVersion
        self.mark = mark
        self.encoding = encoding
        self.data = data
        self.scales = scales
        self.config = config
    }

    /// Decodes a spec from JSON data, rejecting unknown spec versions.
    public static func decode(from json: Foundation.Data) throws -> ChartSpec {
        try JSONDecoder().decode(ChartSpec.self, from: json)
    }

    /// Encodes the spec back to JSON data.
    public func encodeJSON() throws -> Foundation.Data {
        try JSONEncoder().encode(self)
    }
}
