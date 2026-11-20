# Charts

`@thomasfosterau/components/charts`. One component, `Chart`, over a declarative series spec, drawn as plain SVG with no charting dependency. Its props, defaults and ARIA contract are in its doc comments. For the portable, renderer-agnostic spec and its other interpreters, see the separate `@thomasfosterau/charts` package.

```svelte
<script lang="ts">
  import { Chart, type ChartSeries } from '@thomasfosterau/components/charts';

  const series: ChartSeries[] = [
    { key: 'flowering', label: 'Flowering', points: [{ label: 'Sep', value: 4 }, { label: 'Oct', value: 9 }] },
    { key: 'pest', label: 'Pest', points: [{ label: 'Sep', value: 6 }, { label: 'Oct', value: 5 }] },
  ];
</script>

<Chart {series} kind="bar" title="Observations by kind" formatValue={(v) => `${v} kg`} showTable />
```

`ChartSeries` is `{ key, label, points: readonly ChartPoint[] }` and `ChartPoint` is `{ label, value }` — `label` the x-axis category, already localised; every series shares the first series' categories, in x order. `ChartKind` is `'line' | 'area' | 'bar'`.

Rules it enforces rather than leaving to the caller: one y axis (two measures of different scale are two charts); the zero line is always drawn; identity is never colour alone (a legend for 2+ series, a direct end-of-line label for ≤4); the numbers are always readable as a `<table>`, visually hidden by default. `key` is stable identity and picks the colour, so a filtered-out series never repaints the survivors that remain.

## Chart palette rules

Series colours come from four validated custom properties in [`theme.css`](../packages/components/src/lib/theme.css) (its "Categorical chart slots" block), `--color-chart-1…4`, assigned to series by order and never cycled.

- **Order is the safety mechanism.** The separation gates are measured on adjacent pairs, which is what a line, bar or stack actually puts side by side. Re-ordering the slots invalidates the measurement: slots 2 and 4 (indigo/blue) are ΔE 2.7 apart in light and 0.4 in dark under simulated dichromacy, i.e. no colour difference at all for that reader if put next to each other.
- **Four is the cap; three is the cap for a form that compares every pair at once** (a scatter, a choropleth, a pie), where even the best-separated pair (1↔3) falls to ΔE 4.9 under protanopia. A fifth series is a design problem: fold it into "other", or facet; never a generated hue. `Chart` draws a fifth in `--color-neutral` and names it in the legend.
- **Status colours are not series colours.** Slot 3 is amber-600, not the amber-500 that is `--color-warning`, so a series can never impersonate a state.
- **The data table is always in the DOM.** `Chart`'s `sr-only` table is present regardless of `showTable`: colour is the fast path, never the only one.

A consumer replacing `theme.css`'s two themes must replace all four chart slots with their own measured set, in the same order.
