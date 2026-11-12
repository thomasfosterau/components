---
'@thomasfosterau/charts': minor
---

**Breaking (0.x minor): a categorical `y` now runs top-down.** In the core, and so in the Svelte and ProseMirror interpreters, a `nominal` or `ordinal` `y` puts its first category at the top band or point. Before this release it was at the bottom. This matches what Vega-Lite and ChartSpecKit already drew, so one spec now reads the same in every interpreter. A continuous `y` (`quantitative`, `temporal`) is unchanged and still runs bottom-up.

**Migration.** A chart that relied on the old order (the first category at the bottom) can restore it by reversing its categories in `scales.y.domain`. That also flips it in Vega-Lite and Swift, so the interpreters stay in agreement. A chart that passed a reversed `scales.y.domain` to work around the old order can drop it.

New: `ganttSpec(rows, { task, start, end, group?, title?, time? })`, a pure builder for a spec 1.1 range-bar Gantt. It sorts the rows by start, so the earliest task is the top row in every interpreter.
