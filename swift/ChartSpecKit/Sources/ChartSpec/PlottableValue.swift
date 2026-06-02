import Foundation

// MARK: - Typed value reconstruction
//
// The cross-platform invariant: plottable values are reconstructed from the
// channel's *declared* encoding type, never by sniffing JSON runtime values.
// A `Date` comes from `type: "temporal"`, a category from `type: "nominal"`,
// regardless of what the JSON value happens to look like.

/// A typed, plottable value reconstructed from a datum.
public enum TypedValue: Equatable, Sendable {
    case quantitative(Double)
    case temporal(Date)
    case categorical(String)
}

/// Errors thrown when a datum value contradicts its declared encoding type.
public enum TypedValueError: Error, Equatable, Sendable {
    case notANumber(field: String)
    case notADate(field: String)
}

extension Channel {
    /// Reconstructs the typed value of this channel from a datum.
    ///
    /// - Returns: `nil` when the field is missing or null (the datum is
    ///   skipped by renderers), the typed value otherwise.
    /// - Throws: ``TypedValueError`` when the value contradicts the declared
    ///   type — a data error the caller must surface, not hide.
    public func typedValue(from datum: Datum) throws -> TypedValue? {
        guard let raw = datum[field], raw != .null else { return nil }

        switch type {
        case .quantitative:
            guard case .number(let value) = raw else {
                throw TypedValueError.notANumber(field: field)
            }
            return .quantitative(value)

        case .temporal:
            return .temporal(try parseTemporal(raw))

        case .nominal, .ordinal:
            switch raw {
            case .string(let value): return .categorical(value)
            case .number(let value): return .categorical(formatCategoryNumber(value))
            case .bool(let value): return .categorical(String(value))
            case .null: return nil
            }
        }
    }

    private func parseTemporal(_ raw: DatumValue) throws -> Date {
        switch raw {
        case .number(let epochMilliseconds):
            return Date(timeIntervalSince1970: epochMilliseconds / 1000)
        case .string(let iso):
            if let date = Self.isoWithFractionalSeconds.date(from: iso) {
                return date
            }
            if let date = Self.iso.date(from: iso) {
                return date
            }
            if let date = Self.isoDateOnly.date(from: iso) {
                return date
            }
            throw TypedValueError.notADate(field: field)
        case .bool, .null:
            throw TypedValueError.notADate(field: field)
        }
    }

    private func formatCategoryNumber(_ value: Double) -> String {
        // Categories that are whole numbers (e.g. years) format without a
        // trailing ".0", matching how the TypeScript core stringifies them.
        if value == value.rounded() && value.magnitude < 1e15 {
            return String(Int64(value))
        }
        return String(value)
    }

    private static let isoWithFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let iso: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private static let isoDateOnly: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter
    }()
}
