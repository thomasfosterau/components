---
'@thomasfosterau/charts': minor
---

Add `@thomasfosterau/charts/svelte`, a Svelte 5 interpreter of the portable chart spec: a `Chart` component that renders the same SVG as the React and Vue ones, under `svelte/server` and on the client. It spreads native SVG attributes onto the `<svg>` (a caller's `aria-label` replaces the title-derived name) and takes a `fallback` snippet that receives the error message. It ships as `.svelte` source; `svelte` (^5.40.0) is a new optional peer.

`@thomasfosterau/charts/core` gains `resolveChart(spec, box, data?, options?)` and its `ResolvedChart` result: validation plus `computeContext`, with every failure returned as a message instead of thrown. The React, Vue and Svelte `Chart` components are now built on it; their output and messages are unchanged.
