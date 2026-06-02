---
'@thomasfosterau/chart-vue': minor
---

Initial release of the Vue 3 interpreter.

The `Chart` component renders portable chart specs as SVG via
`@thomasfosterau/chart-core`. Written as plain render functions (no SFC
compilation required), so any Vue 3 app — bundled, SSR, or CDN — can consume
it. Works identically with `@vue/server-renderer` and on the client; invalid
specs and unresolved data references render the `fallback` slot or a default
alert.
