---
'@thomasfosterau/chart-prosemirror': minor
---

Initial release of the ProseMirror integration (Layer 3 interpreter).

`createChartNodeSpec()` defines the chart atom node whose attrs carry the
portable chart spec as pure JSON, so document persistence and HTML
copy/paste round-trips preserve the chart. `ChartNodeView` /
`chartNodeViewFactory()` render charts at edit time: imperative DOM, SVG
output computed via `@thomasfosterau/chart-core`, with placeholder states
for missing specs and unresolved data references. `renderContextToSvg()`
exposes the pure ChartContext → SVG string renderer.
