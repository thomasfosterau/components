---
'@thomasfosterau/charts': patch
---

Optional properties of the TypeScript-API types now accept an explicit `undefined`, so a wrapper can forward its own optional props under `exactOptionalPropertyTypes`: React `ChartProps`, `ComputeContextOptions.margins`, `ChartScales` / `ChartTicks`, the ProseMirror `ChartNodeViewOptions` / `ChartNodeSpecOptions`, `EmitVegaLiteOptions` and the line geometry's `pathOf`. Passing `undefined` behaves exactly like omitting the property. The chart spec and Vega-Lite document types keep key-optional members, matching the JSON Schema.
