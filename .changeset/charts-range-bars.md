---
'@thomasfosterau/charts': minor
---

Spec 1.1: add the `x2` / `y2` range channels. With `mark: "bar"`, each bar spans its start to its end, which is the basis of Gantt and timeline charts.

- `SPEC_VERSION` is now `'1.1'`, and `'1'` specs stay valid. `parseSpec` rejects a range channel in a `'1'` spec, on a non-bar mark, or with a type that doesn't match its start channel.
- The core draws horizontal and vertical range bars, normalising an end before its start.
- The Vega-Lite emitter maps `x2` / `y2` straight across, and ChartSpecKit decodes and renders them with `BarMark(xStart:xEnd:y:)`.
- The JSON Schema is regenerated, and the README records the minor-version rule.
