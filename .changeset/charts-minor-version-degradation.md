---
'@thomasfosterau/charts': minor
---

Degrade newer `1.N` specs, and render every chart's data as a table.

- `parseSpec` / `validateSpec` read a `specVersion` of `'1.N'` above `'1.1'` as `'1.1'`, ignoring keys they do not know and reporting them (with the declared version) as the result's `degradation`. An unknown mark fails validation with `unsupported` (the spec's known fields), and `parseSpec` throws the new `UnsupportedMarkError`, a `SpecValidationError`. `'1'` and `'1.1'` stay strict, other majors are rejected, and the JSON Schema is unchanged. `SpecValidationError#name` is now typed `string`.
- `/core`: `buildDataTable` turns a spec and its rows into a text table (a range as "start to end", a tree's nodes with their parents). `resolveChart` returns it as `table`, passes `degradation` through, and resolves an unknown mark to a new `'unsupported'` kind; code that treats every non-`'error'` result as `'ready'` must handle it.
- `/svelte` `Chart` renders the table visually hidden beside the SVG, and visible for an unsupported mark (new `tableLabel`, `rangeSeparator` and `unsupportedMessage` props). `/prosemirror` adds `renderDataTable` and does the same in the NodeView; `parseDOM` does not take a newer `1.N` spec. `/vega` throws `'unsupported-mark'` for any mark it does not know.
