---
'@thomasfosterau/chart-spec': minor
'@thomasfosterau/chart-core': minor
---

Initial release of the portable chart architecture foundation.

`@thomasfosterau/chart-spec` (Layer 1): the durable, renderer-agnostic,
language-neutral chart specification. Effect v4 Schema source, plain
TypeScript public API (`parseSpec` / `validateSpec` / `encodeSpec`), and an
emitted JSON Schema artifact (`schema/chart-spec.v1.json`) as the
cross-language contract.

`@thomasfosterau/chart-core` (Layer 2): the pure TypeScript geometry core.
`computeContext(spec, box, data)` resolves scales from declared encoding
types, builds per-mark geometry (line, bar, point, area), and computes
deterministic UTC ticks. Depends only on chart-spec, d3-scale, and d3-shape.

This replaces the previous Pancake-based Svelte component library.
