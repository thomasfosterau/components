---
'@thomasfosterau/chart-vega': minor
---

Initial release of the Vega-Lite emitter (Layer 3 interpreter).

`emitVegaLite(spec, options?)` converts portable chart specs to Vega-Lite v6
specifications: marks and typed encodings translate one-to-one, inline
values and url refs map directly, query/node refs require host-resolved
rows, and web-only extensions are ignored. The test suite compiles every
emitted spec with the real Vega-Lite compiler (warnings as failures),
proving the portable spec is genuinely Vega-Lite-shaped.
