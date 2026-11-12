# @thomasfosterau/charts

A portable, renderer-agnostic charting system built around a durable chart specification: the spec and its JSON Schema, a pure TypeScript geometry core, and interpreters for Svelte, ProseMirror and Vega-Lite, plus a Swift package, [`ChartSpecKit`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/swift/ChartSpecKit), that decodes the same JSON.

It is unrelated to `Chart` from [`@thomasfosterau/components/charts`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/README.md), which takes its own series props rather than this spec.

## Install

```sh
pnpm add @thomasfosterau/charts
```

The package is ESM-only. The spec, core and Vega-Lite entries need nothing else. The framework entries need their framework, declared as an optional peer: `svelte` (`^5.40.0`) for `/svelte`, and `prosemirror-model` and `prosemirror-view` (`^1.0.0`) for `/prosemirror`.

## Example

```ts
import { parseSpec } from '@thomasfosterau/charts';
import { computeContext } from '@thomasfosterau/charts/core';

const spec = parseSpec({
  specVersion: '1.1',
  mark: 'bar',
  encoding: {
    x: { field: 'fruit', type: 'nominal' },
    y: { field: 'count', type: 'quantitative' },
  },
  data: {
    values: [
      { fruit: 'apple', count: 3 },
      { fruit: 'pear', count: 5 },
    ],
  },
});

const context = computeContext(spec, { width: 640, height: 360 });
context.geometry; // bars in plot coordinates, ready for any renderer
```

In Svelte, `<Chart {spec} />` from `@thomasfosterau/charts/svelte` renders the same spec as SVG.

## Entry points

| Entry | What | Peer to install |
| --- | --- | --- |
| `@thomasfosterau/charts` | The portable spec: types, `parseSpec` / `validateSpec` / `encodeSpec`, `ganttSpec` | none |
| `@thomasfosterau/charts/core` | Pure geometry core: `computeContext`, `resolveChart`, scales, ticks, data tables | none |
| `@thomasfosterau/charts/svelte` | Svelte 5 `Chart` component, SSR-compatible, shipped as `.svelte` source | `svelte` |
| `@thomasfosterau/charts/prosemirror` | Chart node, edit-time NodeView and a DOM-free SVG string renderer | `prosemirror-model`, `prosemirror-view` |
| `@thomasfosterau/charts/vega` | Spec to Vega-Lite emitter | none |
| `@thomasfosterau/charts/schema.json` | The JSON Schema (draft 2020-12) | none |

## Docs

- [Chart spec](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-spec.md): architecture, invariants, example specs (line, Gantt, taxonomy) and the versioning rule.
- API reference: the TSDoc on each export, which your editor shows on hover and which ships in the published `.d.ts`. Per-entry usage examples are in the chart spec guide.
- [Capability matrix](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-capability-matrix.md): which interpreters honour which spec fields, and how each degrades.
- Contributing: the [root README](https://github.com/thomasfosterau/components/blob/trunk/README.md) and [AGENTS.md](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/AGENTS.md).

## License

MIT © Thomas Foster
