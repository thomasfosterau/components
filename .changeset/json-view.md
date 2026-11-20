---
'@thomasfosterau/components': minor
---

Add `JsonView`, a read-only tree of any JSON-compatible value on `TreeView`. Nodes are named as they read ("count: 12, number"). It has a filter that keeps ancestors and counts matches, Expand all and Collapse all, Ctrl/⌘+C and toolbar copying of a node's value or JSONPath, long-string truncation, cycle markers and a `renderValue` snippet. `formatJsonPath` and the `JsonEntry`, `JsonKind` and `JsonPathSegment` types are exported with it.
