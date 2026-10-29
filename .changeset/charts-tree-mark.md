---
'@thomasfosterau/charts': minor
---

Add the `tree` mark (spec 1.1): `encoding.id`, `encoding.parent` and `encoding.label`, and `tree` options (`orientation`, `linkStyle`). The core lays a tree out tidily (`buildTreeGeometry`) and reports bad rows by number; the React, Vue, Svelte and ProseMirror interpreters draw it with a visually hidden nested-list text alternative beside the SVG (`renderTreeOutline`, `VISUALLY_HIDDEN_STYLE`, `outlineText`). `emitVegaLite` throws `VegaLiteEmitError` with the new `reason` `'unsupported-mark'` for a tree. ChartSpecKit decodes the mark and draws it with `TreeLayout` on a SwiftUI canvas.
