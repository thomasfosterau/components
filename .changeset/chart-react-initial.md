---
'@thomasfosterau/chart-react': minor
---

Initial release of the React interpreter.

`<Chart spec data? width? height? margins? fallback? />` renders portable
chart specs as SVG via `@thomasfosterau/chart-core`. Pure rendering with
`useMemo`, so it works identically with server rendering
(`renderToString` / `renderToStaticMarkup`) and on the client, and hydrates
without mismatches. Invalid specs and unresolved data references render a
fallback (custom node, render prop, or default alert).
