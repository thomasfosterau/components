---
'@thomasfosterau/charts': minor
---

Breaking: the ProseMirror interpreter now targets [effect-richtext](https://github.com/thomasfosterau/effect-richtext), and moves from `@thomasfosterau/charts/prosemirror` to `@thomasfosterau/charts/richtext`. Its optional peers `prosemirror-model` and `prosemirror-view` are replaced by `@thomasfosterau/effect-richtext` (`^0.3.0`). The exports and their behaviour are unchanged: build the schema with `DocSchema` from `@thomasfosterau/effect-richtext/Model` and pass `chartNodeViewFactory()` in `EditorView.make`'s `nodeViews`. `createChartNodeSpec` now returns a `ChartNodeSpec`, which declares the `spec` attr, so a typed schema knows chart nodes have `attrs.spec`.
