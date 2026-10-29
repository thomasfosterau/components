import Foundation

// MARK: - Tree layout (spec 1.1 `tree` mark)
//
// The same algorithm as the TypeScript core's `buildTreeGeometry`, in unit
// coordinates so any renderer can scale it: leaves take consecutive breadth
// slots in depth-first order, and every parent sits centred over its first
// and last child. Linear in the number of rows; siblings' subtrees occupy
// disjoint slot ranges, so boxes never overlap. A forest's roots stand side
// by side as if under one invisible root.

/// Errors in a tree's rows. Each names the offending row, 1-based.
public enum TreeLayoutError: Error, Equatable, Sendable {
    case missingChannels
    case missingId(row: Int)
    case duplicateId(row: Int, id: String)
    case unknownParent(row: Int, parent: String)
    case cycle(row: Int)
}

/// A laid-out tree: nodes in depth-first order with their breadth slot and depth.
public struct TreeLayout: Equatable, Sendable {
    public struct Node: Equatable, Sendable, Identifiable {
        public let id: String
        public let label: String
        /// The colour-channel category, named in words for the text alternative.
        public let category: String?
        public let depth: Int
        /// Position along the breadth axis, in leaf slots (a leaf's slot is its centre minus 0.5).
        public let slot: Double
        public let parentId: String?
    }

    /// Nodes in depth-first order.
    public let nodes: [Node]
    /// The number of leaf slots along the breadth axis (at least 1).
    public let leaves: Int
    /// The deepest node's depth (0 for a tree of roots only).
    public let maxDepth: Int

    /// Lays out a `tree` spec's rows.
    public static func layout(spec: ChartSpec, rows: [Datum]) throws -> TreeLayout {
        guard let idChannel = spec.encoding.id, let parentChannel = spec.encoding.parent else {
            throw TreeLayoutError.missingChannels
        }

        struct Row {
            let id: String
            let label: String
            let category: String?
            let parent: String?
            var children: [String] = []
        }

        var order: [String] = []
        var byId: [String: Row] = [:]
        for (index, datum) in rows.enumerated() {
            guard let id = key(idChannel, datum) else { throw TreeLayoutError.missingId(row: index + 1) }
            if byId[id] != nil { throw TreeLayoutError.duplicateId(row: index + 1, id: id) }
            let label = spec.encoding.label.flatMap { key($0, datum) } ?? id
            let category = spec.encoding.color.flatMap { key($0, datum) }
            byId[id] = Row(id: id, label: label, category: category, parent: key(parentChannel, datum))
            order.append(id)
        }

        var roots: [String] = []
        for (index, id) in order.enumerated() {
            guard let parent = byId[id]?.parent else {
                roots.append(id)
                continue
            }
            guard byId[parent] != nil else { throw TreeLayoutError.unknownParent(row: index + 1, parent: parent) }
            byId[parent]?.children.append(id)
        }

        var nodes: [Node] = []
        var nextLeaf = 0
        var maxDepth = 0
        var reached = Set<String>()

        // Returns the node's slot; children are placed before their parent's slot is known.
        func walk(_ id: String, depth: Int, parent: String?) -> Double {
            guard let row = byId[id] else { return 0 }
            reached.insert(id)
            maxDepth = max(maxDepth, depth)
            let index = nodes.count
            nodes.append(Node(id: id, label: row.label, category: row.category, depth: depth, slot: 0, parentId: parent))
            let slot: Double
            if row.children.isEmpty {
                slot = Double(nextLeaf)
                nextLeaf += 1
            } else {
                let placed = row.children.map { walk($0, depth: depth + 1, parent: id) }
                slot = ((placed.first ?? 0) + (placed.last ?? 0)) / 2
            }
            nodes[index] = Node(id: id, label: row.label, category: row.category, depth: depth, slot: slot, parentId: parent)
            return slot
        }
        roots.forEach { _ = walk($0, depth: 0, parent: nil) }

        if let stranded = order.firstIndex(where: { !reached.contains($0) }) {
            throw TreeLayoutError.cycle(row: stranded + 1)
        }
        return TreeLayout(nodes: nodes, leaves: max(nextLeaf, 1), maxDepth: maxDepth)
    }

    /// How a channel's value names a node: categories as given, numbers without a trailing ".0", dates as ISO strings.
    private static func key(_ channel: Channel, _ datum: Datum) -> String? {
        switch try? channel.typedValue(from: datum) {
        case .categorical(let value)?: return value
        case .quantitative(let value)?:
            return value == value.rounded() && value.magnitude < 1e15 ? String(Int64(value)) : String(value)
        case .temporal(let value)?: return ISO8601DateFormatter().string(from: value)
        case nil: return nil
        }
    }
}
