# API reference

Every exported symbol, grouped by the entry that exports it. Signatures are the published TypeScript ones; all object types are `readonly`.

- [`@thomasfosterau/charts`](#thomasfosteraucharts) — the spec
- [`@thomasfosterau/charts/core`](#thomasfosterauchartscore) — geometry
- [`@thomasfosterau/charts/svelte`](#thomasfosterauchartssvelte)
- [`@thomasfosterau/charts/prosemirror`](#thomasfosterauchartsprosemirror)
- [`@thomasfosterau/charts/vega`](#thomasfosterauchartsvega)
- [`@thomasfosterau/charts/schema.json`](#thomasfosterauchartsschemajson)

### `@thomasfosterau/charts`

The portable spec (Layer 1): plain types, the parse / validate / encode functions, and the data guards. Parsing a `'1'` or `'1.1'` document is strict: unknown keys are rejected, exactly where the [JSON Schema](#thomasfosterauchartsschemajson) sets `additionalProperties: false`. A newer `1.N` document degrades instead: its unknown keys are ignored and reported, and an unknown mark comes back as `unsupported` for the data-table fallback (see [Spec versioning](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-spec.md#spec-versioning)).

```ts
import {
  encodeSpec,
  isDataRef,
  parseSpec,
  SpecValidationError,
  validateSpec,
} from '@thomasfosterau/charts';

// `json` is an unknown value, e.g. a stored document attribute.

// Throwing form, for trusted input.
try {
  const spec = parseSpec(json);
  console.log(spec.mark, isDataRef(spec.data) ? spec.data.ref.kind : 'inline');
} catch (error) {
  if (error instanceof SpecValidationError) console.error(error.message);
}

// Result form, for user-supplied input.
const result = validateSpec(json);
if (result.ok) {
  // A newer 1.N document: what this version ignored to read it.
  if (result.degradation) console.warn('Ignored', result.degradation.ignored);
  const persisted = encodeSpec(result.value); // plain JSON, ready to store
} else if (result.unsupported) {
  // A newer 1.N mark: show its data as a table (resolveChart does this for you).
  console.warn(result.unsupported.spec.mark);
} else {
  console.error(result.errors.join('\n'));
}
```

#### Functions

| Function | Description |
| --- | --- |
| `parseSpec(input: unknown): ChartSpec` | Parses an unknown JSON value into a `ChartSpec`. Throws `SpecValidationError` when the value is not a valid spec; all problems are collected into the one message. A newer `1.N` document is read as `SPEC_VERSION` with its unknown keys dropped; one whose mark is unknown throws `UnsupportedMarkError` (a `SpecValidationError`, carrying the spec). |
| `validateSpec(input: unknown): ValidationResult` | The same check, returning a result instead of throwing. On failure, `errors` currently holds one string that describes every problem found, each with its path. A newer `1.N` document that parses is `ok` with a `degradation` (its declared version and the ignored paths); one whose mark is unknown fails with an error naming the mark and carries `unsupported`. |
| `encodeSpec(spec: ChartSpec): unknown` | Encodes a spec back to a plain JSON-safe value for persisting (for example into ProseMirror node attrs). Throws if `spec` does not satisfy the schema. |
| `isInlineData(data: Data): data is InlineData` | `true` when the spec's data is inline `values`. |
| `isDataRef(data: Data): data is DataRef` | `true` when the spec's data is an external `ref`. |
| `ganttSpec(rows: readonly Datum[], options: GanttOptions): ChartSpec` | Builds a spec 1.1 range-bar chart (a Gantt): the rows sorted by `options.start` (an unreadable start goes last; ties keep input order). `y` is the nominal `task`, `x` / `x2` are `start` / `end`, and `color` is the nominal `group` when given. `scales.y.domain` lists the tasks in start order, so the earliest is the top row in every interpreter; with `time: 'quantitative'`, `scales.x.zero` is `false`. `GanttOptions` is `{ task; start; end; group?; title?; time? = 'temporal' }` (field names; `time` is `'temporal' \| 'quantitative'`). Pure: the input rows are not mutated. |

#### Classes and constants

| Export | Description |
| --- | --- |
| `SpecValidationError` | `Error` subclass (`name: 'SpecValidationError'`) thrown by `parseSpec`. |
| `UnsupportedMarkError` | `SpecValidationError` subclass (`name: 'UnsupportedMarkError'`) thrown by `parseSpec` for a newer `1.N` document whose mark is unknown; `unsupported: UnsupportedMark` carries its known fields. |
| `SPEC_VERSION` | `'1.1'`: the version a new spec should declare. `parseSpec` reads `'1'` and `'1.1'` strictly, degrades a newer `'1.N'`, and rejects any other `specVersion` (see [Spec versioning](https://github.com/thomasfosterau/components/blob/trunk/docs/charts-spec.md#spec-versioning)). |

#### Types

| Type | Shape and role |
| --- | --- |
| `ChartSpec` | The portable spec: `{ specVersion: SpecVersion; mark: Mark; encoding: Encoding; data: Data; scales?: Scales; config?: Config; tree?: TreeOptions; extensions?: Extensions }`. |
| `SpecVersion` | `'1' \| '1.1'`. |
| `Mark` | `'bar' \| 'line' \| 'point' \| 'area' \| 'tree'` — the v1 four are the intersection of the native charting vocabularies; `tree` (spec 1.1) is a hierarchy drawn by its own layout. |
| `FieldType` | `'quantitative' \| 'ordinal' \| 'nominal' \| 'temporal'` — the declared type of an encoded field. Temporal values are ISO 8601 strings or epoch milliseconds. |
| `Channel` | `{ field: string; type: FieldType }` — maps a data field to a visual channel. Interpreters read values by the declared `type`, never by sniffing. |
| `Encoding` | `{ x?, y?, x2?, y2?, color?, size?, opacity?: Channel }`. Every v1 mark needs `x` and `y` to draw anything; `x2` / `y2` (spec 1.1) make a `bar` a range bar. `id` / `parent` / `label` (spec 1.1) belong to the `tree` mark, which takes no positional channels. |
| `TreeOptions` | `{ orientation?: 'vertical' \| 'horizontal'; linkStyle?: 'orthogonal' \| 'curved' }` (spec 1.1) — layout of the `tree` mark: roots at the top (default) or the left, right-angled (default) or curved links. |
| `DatumValue` | `string \| number \| boolean \| null` — one value in a row. |
| `Datum` | `{ [field: string]: DatumValue }` — one flat data row. |
| `InlineData` | `{ values: ReadonlyArray<Datum> }` — rows embedded in the spec. |
| `DataRefKind` | `'query' \| 'node' \| 'url'` — what an external reference points at: a host query, another content node, or a URL returning JSON rows. |
| `DataRef` | `{ ref: { kind: DataRefKind; id: string } }` — data stored outside the spec, resolved by the host. |
| `Data` | `InlineData \| DataRef` — exactly one of the two. |
| `ScaleHint` | `{ domain?: ReadonlyArray<number \| string>; nice?: boolean; zero?: boolean }` — optional hints for one positional scale. |
| `Scales` | `{ x?: ScaleHint; y?: ScaleHint }`. |
| `Config` | `{ title?: string; tooltip?: boolean }` — portable presentation hints. |
| `Extensions` | `{ [key: string]: unknown }` — web-only hints; native interpreters ignore the whole object. |
| `ValidationResult` | `{ ok: true; value: ChartSpec; degradation?: SpecDegradation \| undefined } \| { ok: false; errors: ReadonlyArray<string>; unsupported?: UnsupportedMark \| undefined }`. Both optional members are absent for a `'1'` or `'1.1'` document. |
| `SpecDegradation` | `{ declaredVersion: string; ignored: ReadonlyArray<string> }` — how a newer `1.N` document was read: the version it declared, and the paths (`["encoding"]["shape"]`) of the keys ignored, in document order. |
| `UnsupportedMark` | `{ spec: UnsupportedMarkSpec; degradation: SpecDegradation }` — a newer `1.N` document whose mark is unknown. |
| `UnsupportedMarkSpec` | `{ specVersion: SpecVersion; mark: string; encoding: Encoding; data: Data; scales?: Scales; config?: Config; extensions?: Extensions }` — that document's known fields, `mark` as written and `specVersion` normalised to `SPEC_VERSION`; `tree` options are dropped with the mark. What the data-table fallback renders. |

### `@thomasfosterau/charts/core`

The pure geometry core (Layer 2): `(spec, box, rows)` in, dimensions, scales, geometry and ticks out, all in pixel coordinates. Synchronous, with no DOM and no fetching. Most consumers call only `computeContext`; the scale, tick and geometry functions are there for interpreters that need finer control.

```ts
import { parseSpec } from '@thomasfosterau/charts';
import { computeContext } from '@thomasfosterau/charts/core';

const spec = parseSpec({
  specVersion: '1',
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

const context = computeContext(spec, { width: 640, height: 360 }, undefined, {
  margins: { left: 64 },
});

context.dimensions.plot; // { width: 556, height: 300 }
context.ticks.x?.map((tick) => tick.label); // ['apple', 'pear']
if (context.geometry.mark === 'bar') {
  // `draw` stands in for your renderer.
  for (const bar of context.geometry.bars) draw(bar.x, bar.y, bar.width, bar.height, bar.color);
}
```

Geometry is in **plot** coordinates: translate by `dimensions.margins.left` / `.top` to place it in the outer box.

#### Functions

| Function | Description |
| --- | --- |
| `resolveChart(spec: unknown, box: Box, data?: DataRows, options?: ResolveChartOptions): ResolvedChart` | `validateSpec` then `computeContext` and `buildDataTable`, with every failure returned as a message instead of thrown: `Invalid chart spec: …`, a data `ref` with no `data` passed, or the error the core threw. A newer `1.N` spec draws from its known subset (`degradation` says what was ignored); one whose mark is unknown resolves to `unsupported` with its `table`, which the interpreters show in place of a drawing. The bundled Svelte `Chart` component renders its `error` message as its fallback. |
| `buildDataTable(spec: ChartSpec \| UnsupportedMarkSpec, rows: DataRows, options?: DataTableOptions): DataTable` | The chart's data as a table, the text alternative every interpreter renders: one column per encoded channel headed by its field (`x` with `x2`, or `y` with `y2`, as one "start to end" column; a channel repeating an earlier column's field is left out), one row per datum, each cell formatted by the declared type (numbers as written, dates as ISO 8601, the date alone at UTC midnight, missing values empty). A `tree` lists each node (its label, else its id) with its parent, named by label where there is a `label` channel. The caption is `config.title`. Throws `TypeError` when a value contradicts its declared type. |
| `computeContext(spec: ChartSpec, box: Box, data?: DataRows, options?: ComputeContextOptions): ChartContext` | Turns a parsed spec, the measured outer box and resolved rows into a `ChartContext`. `data`, when passed, is used instead of the spec's inline values; it is required when the spec's data is a `ref` (otherwise throws `Error`). Throws `TypeError` when a value contradicts its channel's declared type. x maps onto `[0, plot.width]`. A continuous y (`quantitative`, `temporal`) maps onto `[plot.height, 0]`, so larger values sit higher; a categorical y (`nominal`, `ordinal`) maps onto `[0, plot.height]`, so the first category is the top band or point, as in Vega-Lite and ChartSpecKit. Without both `x` and `y` encodings the geometry is empty. |
| `computeDimensions(outer: Box, margins?: Partial<Margins>): Dimensions` | Fills missing margins from `DEFAULT_MARGINS` and subtracts them from the box; the plot width and height are clamped at zero. |
| `makeAccessor(channel: Channel): (datum: Datum) => FieldValue` | A typed reader for one channel: `quantitative` → finite number, `temporal` → `Date` (ISO 8601 string or epoch ms), `ordinal` / `nominal` → string (numbers and booleans stringified). Missing and `null` values read as `null`; a value contradicting the declared type throws `TypeError`. |
| `resolvePositionalScale(channel: Channel, mark: Mark, pixelRange: readonly [number, number], data: DataRows, hint?: ScaleHint): PositionalScale` | Builds an x or y scale from the channel's type: `quantitative` → linear, `temporal` → UTC time, `ordinal` / `nominal` → band (padding 0.1) for `bar`, point (padding 0.5) otherwise. A continuous `hint.domain` with at least two entries supplies its first and last as the domain (otherwise the data extent is used); a categorical one is used whole. `hint.zero` (default `true` on a `bar` mark, else `false`) extends a linear domain to include zero, and `hint.nice` rounds linear and UTC domains. A single-value domain is padded (±1, or ±1 day). |
| `resolveColorScale(channel: Channel, data: DataRows): ResolvedScale` | `ordinal` / `nominal` → an `ordinal` scale onto `CATEGORICAL_PALETTE` in first-seen order (colours repeat past ten categories). `quantitative` / `temporal` → a `linear` scale normalised to `[0, 1]`, for the interpreter to map onto its own gradient. |
| `resolveSizeScale(channel: Channel, data: DataRows): ResolvedScale` | A square-root scale from the data extent onto `DEFAULT_RADIUS_RANGE`, so symbol area is proportional to the value. Only numeric (quantitative) values map; its `kind` reads `'linear'`. |
| `computeTicks(scale: PositionalScale, count?: number): Tick[]` | Axis ticks: d3 tick generation and formatting for linear and UTC scales (`count` defaults to `DEFAULT_TICK_COUNT`; UTC labels are time-zone independent); one tick per category, centred on its band, for band and point scales. |
| `buildLineGeometry(args): LineGeometry` | One `Series` per colour category (one unsplit series without a colour encoding), each with its points and an SVG path. Rows missing either position are skipped. |
| `buildAreaGeometry(args): AreaGeometry` | As `buildLineGeometry`, with each path closed down to the zero baseline, or to the bottom of the plot when y is not linear. |
| `buildBarGeometry(args): BarGeometry` | One `BarRect` per row, grown from the zero baseline (negative values hang below it). Band x-scales give the bar width; continuous x-scales get 80% of an equal share of the plot width, at least 1 px. |
| `buildTreeGeometry(args: { data; plot: Box; id: Channel; parent: Channel; label?; color?; colorScale?; options?: TreeOptions }): TreeGeometry` | Lays out a `tree`: leaves take equal breadth slots in depth-first order, each parent centred over its first and last child, depths spread evenly along the other axis, so siblings never overlap. Throws `Error` naming the row (1-based) on a missing or duplicate id, a parent that is not an id, or a cycle; `resolveChart` returns it as the message. |
| `outlineText(node: { label: string; category: string \| undefined }): string` | The text of one entry in a tree's nested-list alternative: the label, then the colour category in words. |
| `buildPointGeometry(args & { size?: Channel \| undefined; sizeScale?: ResolvedScale \| undefined }): PointGeometry` | One `PointCircle` per row; the radius comes from `sizeScale`, else `DEFAULT_POINT_RADIUS`. |

The four builders take `args: { data: DataRows; x: Channel; y: Channel; xScale: PositionalScale; yScale: PositionalScale; color?: Channel | undefined; colorScale?: ResolvedScale | undefined }`; series splitting and colours need both `color` and `colorScale`.

#### Constants

| Constant | Value | Role |
| --- | --- | --- |
| `DEFAULT_MARGINS` | `{ top: 20, right: 20, bottom: 40, left: 48 }` | Margins used where `ComputeContextOptions.margins` gives none; room for tick labels. |
| `CATEGORICAL_PALETTE` | Tableau 10: `'#4e79a7'`, `'#f28e2c'`, `'#e15759'`, `'#76b7b4'`, `'#59a14f'`, `'#edc949'`, `'#af7aa1'`, `'#ff9da7'`, `'#9c755f'`, `'#bab0ab'` | Colours for categorical colour encodings. The bundled interpreters draw uncoloured marks in its first entry. |
| `DEFAULT_RADIUS_RANGE` | `[3, 12]` | Radius range in pixels for the `size` channel on point marks. |
| `DEFAULT_POINT_RADIUS` | `4` | Point radius when there is no size encoding or the value is missing. |
| `DEFAULT_TICK_COUNT` | `5` | Target tick count for continuous scales in `computeTicks`. |
| `VISUALLY_HIDDEN_STYLE` | an inline `style` string | The visually-hidden style every interpreter puts on its data table and a tree's nested-list alternative (inline, since the interpreters ship no CSS). |
| `DEFAULT_RANGE_SEPARATOR` | `' to '` | Joins a range's start and end in a data table's header and cells. |

#### Types

| Type | Shape and role |
| --- | --- |
| `Box` | `{ width: number; height: number }` — a pixel box. |
| `Margins` | `{ top; right; bottom; left: number }` — pixels between the outer box and the plot. |
| `Dimensions` | `{ outer: Box; margins: Margins; plot: Box }` — `plot` is `outer` minus `margins`. |
| `ComputeContextOptions` | `{ margins?: Partial<Margins> }`. |
| `ResolveChartOptions` | `ComputeContextOptions & DataTableOptions` — the options of `resolveChart`. |
| `DataTableOptions` | `{ rangeSeparator?: string \| undefined }` — default `DEFAULT_RANGE_SEPARATOR`. |
| `DataTable` | `{ caption: string \| undefined; columns: ReadonlyArray<DataTableColumn>; rows: ReadonlyArray<ReadonlyArray<string>> }` — every cell is text, one per column. |
| `DataTableColumn` | `{ channels: ReadonlyArray<keyof Encoding>; header: string }` — the channels a column shows (one, or a range's two). |
| `DataRows` | `ReadonlyArray<Datum>` — resolved rows, what the host passes after resolving a data ref. |
| `FieldValue` | `number \| Date \| string \| null` — a typed value read by `makeAccessor`; `null` means missing, and geometry builders skip the row. |
| `DomainValue` | `number \| string \| Date` — a value in a scale's domain. |
| `ScaleKind` | `'linear' \| 'utc' \| 'band' \| 'point' \| 'ordinal'`. |
| `ResolvedScale` | `{ kind: ScaleKind; domain: ReadonlyArray<DomainValue>; range: ReadonlyArray<number> \| ReadonlyArray<string>; apply(value: DomainValue): number \| string \| undefined; bandwidth: number }` — a callable scale plus a serialisable description (`kind`, `domain`, `range`) from which the mapping can be rebuilt. `apply` returns `undefined` for an unmappable value; `bandwidth` is 0 except on band scales. |
| `PositionalScale` | A discriminated union on `kind` (`'linear' \| 'utc' \| 'band' \| 'point'`) of `{ kind; resolved: ResolvedScale; d3 }`, where `d3` is the matching `d3-scale` scale. The input to `computeTicks` and the geometry builders. |
| `ChartScales` | `{ x?; y?; color?; size?: ResolvedScale }` — the scales `computeContext` resolved, one per encoded channel (opacity is not resolved). |
| `Tick` | `{ value: DomainValue; position: number; label: string }` — `position` is in plot pixels along the axis. |
| `ChartTicks` | `{ x?: ReadonlyArray<Tick>; y?: ReadonlyArray<Tick> }`. |
| `ChartContext` | `{ dimensions: Dimensions; scales: ChartScales; geometry: Geometry; ticks: ChartTicks }` — everything an interpreter needs to draw. |
| `ResolvedChart` | `{ kind: 'ready'; spec: ChartSpec; context: ChartContext; table: DataTable; degradation?: SpecDegradation \| undefined } \| { kind: 'unsupported'; spec: UnsupportedMarkSpec; table: DataTable; degradation: SpecDegradation; message: string } \| { kind: 'error'; message: string }` — the result of `resolveChart`. |
| `Geometry` | `LineGeometry \| BarGeometry \| PointGeometry \| AreaGeometry \| TreeGeometry`, discriminated by `mark`. |
| `TreeGeometry` | `{ mark: 'tree'; nodes: ReadonlyArray<TreeNodeBox>; links: ReadonlyArray<TreeLink>; outline: ReadonlyArray<TreeOutlineNode> }` — no scales or ticks; the interpreters draw no axes for it. |
| `TreeNodeBox` | `{ id; label: string; depth; x; y; width; height: number; color: string \| undefined; datum: Datum }` — a node's box in plot pixels, depth-first. |
| `TreeLink` | `{ from; to: string; path: string }` — parent and child ids, and the SVG `d` of the link. |
| `TreeOutlineNode` | `{ id; label: string; category: string \| undefined; children: ReadonlyArray<TreeOutlineNode> }` — the hierarchy for the nested-list text alternative. |
| `LineGeometry` | `{ mark: 'line'; series: ReadonlyArray<Series> }`. |
| `AreaGeometry` | `{ mark: 'area'; series: ReadonlyArray<Series> }` — paths closed to the baseline. |
| `Series` | `{ key: string \| null; color: string \| undefined; points: ReadonlyArray<SeriesPoint>; path: string }` — `key` is the colour category (`null` for the unsplit series), `path` the SVG `d` attribute (`''` with no points). |
| `SeriesPoint` | `{ x: number; y: number; datum: Datum }`. |
| `BarGeometry` | `{ mark: 'bar'; bars: ReadonlyArray<BarRect> }`. |
| `BarRect` | `{ x; y; width; height: number; color: string \| undefined; datum: Datum }`. |
| `PointGeometry` | `{ mark: 'point'; points: ReadonlyArray<PointCircle> }`. |
| `PointCircle` | `{ cx; cy; r: number; color: string \| undefined; datum: Datum }`. |

`color` is `undefined` wherever there is no colour encoding; renderers pick their own default.

### `@thomasfosterau/charts/svelte`

Peer: `svelte` (5.40+). A Svelte 5 `Chart` component. It is published as `.svelte` source (`svelte-package`), so your app's Svelte compiles it; it renders the same under `svelte/server` and on the client.

```svelte
<script lang="ts">
  import type { ChartSpec } from '@thomasfosterau/charts';
  import type { DataRows } from '@thomasfosterau/charts/core';
  import { Chart } from '@thomasfosterau/charts/svelte';

  let { spec, rows }: { spec: ChartSpec; rows: DataRows } = $props();
</script>

<Chart {spec} data={rows} width={800} height={400} class="sales-chart">
  {#snippet fallback(message)}
    <p role="alert">{message}</p>
  {/snippet}
</Chart>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `spec` | `ChartSpec` | required | The spec; validated again at render time, since specs come from documents. |
| `data` | `DataRows` | — | Resolved rows. Required when the spec's data is a `ref`; replaces inline values when given. |
| `width` | `number` | `640` | Outer width in pixels (sets the `viewBox`, and with it the aspect ratio). |
| `height` | `number` | `360` | Outer height in pixels. |
| `margins` | `Partial<Margins>` | `DEFAULT_MARGINS` | Margin overrides. |
| `fallback` | `Snippet<[message: string]>` | alert `<div>` | What to render on an error; receives the message. |
| `tableLabel` | `string` | `'Chart data'` | The data table's caption when the spec has no `config.title`. |
| `rangeSeparator` | `string` | `' to '` | Joins a range's start and end in the data table. |
| `unsupportedMessage` | `string` | `'This chart type is not supported here, so its data is shown as a table.'` | Shown above the visible table for a newer spec's unknown mark. |
| …rest | `SVGAttributes<SVGSVGElement>` | — | Spread onto the `<svg>`. `class` also lands on the default fallback `<div>`; an `aria-label` replaces the one taken from `config.title`. |

It renders `<svg role="img" viewBox="0 0 {width} {height}">`, named by `aria-label` from `config.title`, with the title drawn above the plot when set, followed by the chart's data as a visually hidden `<table data-chart-table>` (captioned by the title, else `tableLabel`; the SVG's `role="img"` makes its own children presentational, so the table is its sibling). For a newer `1.N` spec whose mark it cannot draw it renders `<div data-chart-unsupported>` with `unsupportedMessage` and the same table, visible (`class` lands on the `<div>`). On an error (invalid spec, a `ref` with no `data`, or a throw from the core) it renders `fallback`, or by default `<div role="alert" data-chart-error>` with the message.

### `@thomasfosterau/charts/prosemirror`

Peers: `prosemirror-model`, `prosemirror-view` (the example's `prosemirror-state` is your editor's dependency, not a peer of this package). A chart node that stores the spec in its attrs, an edit-time NodeView that draws it, and the DOM-free SVG string renderer the NodeView uses.

```ts
import {
  CHART_NODE_NAME,
  chartNodeViewFactory,
  createChartNodeSpec,
  type DataResolver,
} from '@thomasfosterau/charts/prosemirror';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      group: 'block',
      content: 'text*',
      toDOM: () => ['p', 0],
      parseDOM: [{ tag: 'p' }],
    },
    text: {},
    [CHART_NODE_NAME]: createChartNodeSpec(),
  },
});

// `fetchRows` (your data API) and `spec` (the chart to insert) are the host app's.
const resolveData: DataResolver = async (chart) =>
  'ref' in chart.data ? fetchRows(chart.data.ref.id) : [];

new EditorView(document.querySelector('#editor'), {
  state: EditorState.create({
    schema,
    doc: schema.node('doc', null, [schema.node(CHART_NODE_NAME, { spec })]),
  }),
  nodeViews: { [CHART_NODE_NAME]: chartNodeViewFactory({ resolveData }) },
});
```

#### Functions and classes

| Export | Description |
| --- | --- |
| `createChartNodeSpec(options?: ChartNodeSpecOptions): NodeSpec` | The chart node: an atom (selectable, draggable) whose only attr is `spec` (default `null`), so `toJSON` / `fromJSON` carry the spec as is. `toDOM` writes `<div class="chart-node" data-chart-spec="…">` with the encoded spec JSON (empty for a `null` spec); `parseDOM` reads it back and validates it, and an invalid spec does not match the rule, leaving other rules to try. Nor does a newer `1.N` spec: its parsed value drops what this version does not know, and storing that would rewrite the document. |
| `chartNodeViewFactory(options?: ChartNodeViewOptions): (node: Node, view: EditorView, getPos: () => number \| undefined) => ChartNodeView` | A constructor for the editor's `nodeViews` prop. |
| `ChartNodeView` | `new ChartNodeView(node: Node, view: EditorView, options?: ChartNodeViewOptions)`. A `NodeView` whose `dom` is a `<div class="chart-node-view">` holding the rendered SVG. It re-validates the spec on every render, appends the chart's data as a visually hidden `<table data-chart-table>` after the SVG, and for a newer `1.N` spec whose mark it cannot draw shows `<div class="chart-node-view__unsupported" data-chart-unsupported>` with the message and the table, visible (`Unsupported chart type` when that spec's data is a `ref`: `resolveData` takes a `ChartSpec`). Otherwise it shows a `<div class="chart-node-view__placeholder">` with a message (no chart configured, invalid spec, data stored externally when there is no `resolveData`, loading, failed to load, or the core's error). It measures its own width and keeps `defaultBox`'s aspect ratio. `update` re-renders for a node of the same type (and returns `false` for any other), `ignoreMutation` returns `true`, and `destroy` drops any pending async resolution. |
| `renderTreeOutline(context: ChartContext): string` | A tree's visually hidden nested `<ul>` text alternative as an HTML string (`''` for any other mark). The NodeView appends it after the SVG, whose `role="img"` would otherwise hide the structure. |
| `renderDataTable(table: DataTable, options?: RenderDataTableOptions): string` | A `DataTable` as `<table data-chart-table>` with its caption, a `<th scope="col">` header row and one row per datum, every text escaped. `hidden: true` adds `VISUALLY_HIDDEN_STYLE`, for the table beside a drawing; without it, the visible fallback. |
| `renderContextToSvg(context: ChartContext, options?: RenderSvgOptions): string` | Renders a `ChartContext` to an SVG string with no DOM, for the NodeView's `innerHTML`, server rendering or tests. The root is `<svg role="img" viewBox="…">` with no `aria-label` (the title is drawn as `<text>`); the title, class and tick labels are XML-escaped. |

#### Constants

| Constant | Value | Role |
| --- | --- | --- |
| `CHART_NODE_NAME` | `'chart'` | The conventional node name; use it as the key in your schema's `nodes` and in `nodeViews`. |
| `CHART_SPEC_ATTRIBUTE` | `'data-chart-spec'` | The DOM attribute that carries the serialised spec in `toDOM` / `parseDOM`. |

#### Types

| Type | Shape and role |
| --- | --- |
| `ChartNodeSpecOptions` | `{ group?: string; className?: string }` — node group (default `'block'`) and the class of the serialised `<div>` (default `'chart-node'`). |
| `ChartNodeAttrs` | `{ spec: ChartSpec \| null }` — a chart node's attrs; `null` is an empty placeholder chart. |
| `ChartNodeViewOptions` | `{ defaultBox?: Box; resolveData?: DataResolver; className?: string }` — `defaultBox` (default 640 × 360) is used before the element can be measured and sets the aspect ratio after; without `resolveData`, charts whose data is a `ref` show a placeholder; `className` replaces `'chart-node-view'` on the wrapper. |
| `DataResolver` | `(spec: ChartSpec) => DataRows \| Promise<DataRows>` — resolves a spec's data ref at edit time. A stale promise never overwrites a newer render. |
| `RenderDataTableOptions` | `{ hidden?: boolean \| undefined }` — visually hide the table (default `false`). |
| `RenderSvgOptions` | `{ title?: string \| undefined; className?: string \| undefined }` — title drawn above the plot, and the class of the root `<svg>`. |

### `@thomasfosterau/charts/vega`

No peer: emits a plain Vega-Lite object, so bring your own `vega-embed` (or the Vega-Lite compiler) to render it. The test suite compiles every emitted spec with the real Vega-Lite compiler.

```ts
import { emitVegaLite, VegaLiteEmitError } from '@thomasfosterau/charts/vega';

try {
  // `rows` are the pre-resolved rows a query or node ref needs.
  const vegaLite = emitVegaLite(spec, { rows, height: 300 });
  await vegaEmbed('#chart', vegaLite);
} catch (error) {
  if (error instanceof VegaLiteEmitError) console.error(error.message);
}
```

| Export | Description |
| --- | --- |
| `emitVegaLite(spec: ChartSpec, options?: EmitVegaLiteOptions): VegaLiteSpec` | Translates the mark and typed encodings one-to-one. `config.title` becomes `title`, `config.tooltip` becomes `mark.tooltip`, and `scales.x` / `scales.y` become the x and y `scale` (`domain`, `nice`, `zero`); `extensions` are ignored. Data comes from `options.rows` if given, else inline `values`, else a `url` ref's `id` as `url`. A newer `1.N` spec arrives degraded by `parseSpec`, so it emits from the known subset; an unknown mark never becomes a `ChartSpec` (render `validateSpec`'s `unsupported` with a TS interpreter's table instead), and one forced through a cast throws `'unsupported-mark'`. |
| `VegaLiteEmitError` | `Error` subclass (`name: 'VegaLiteEmitError'`) with a `reason`: `'unresolved-data'` when a `query` or `node` ref arrives without `options.rows`, `'unsupported-mark'` for a `tree` (Vega-Lite has no tree layout) or a mark it does not know. |
| `VegaLiteEmitErrorReason` | `'unsupported-mark' \| 'unresolved-data'`. |
| `VEGA_LITE_SCHEMA` | `'https://vega.github.io/schema/vega-lite/v6.json'` — the `$schema` of every emitted spec. |
| `EmitVegaLiteOptions` | `{ rows?: ReadonlyArray<Datum>; width?: number \| 'container'; height?: number }` — pre-resolved rows, width (default `'container'`, responsive) and height in pixels. |
| `VegaLiteSpec` | `{ $schema: string; title?: string; mark: { type: Mark; tooltip?: boolean }; data: VegaLiteData; encoding: VegaLiteEncoding; width?: number \| 'container'; height?: number }` — the single-view subset the emitter produces, typed structurally rather than imported from `vega-lite`. |
| `VegaLiteData` | `{ values: ReadonlyArray<Record<string, unknown>> } \| { url: string }`. |
| `VegaLiteEncoding` | `{ x?, y?, color?, size?, opacity?: VegaLiteFieldDef; x2?, y2?: VegaLiteSecondaryFieldDef }`. |
| `VegaLiteSecondaryFieldDef` | `{ field }`: a range end, sharing its primary channel's type and scale. |
| `VegaLiteFieldDef` | `{ field: string; type: FieldType; scale?: { domain?: ReadonlyArray<number \| string>; nice?: boolean; zero?: boolean } }`. |

### `@thomasfosterau/charts/schema.json`

The spec's JSON Schema ([`schema/chart-spec.v1.json`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/schema/chart-spec.v1.json), draft 2020-12), generated from the same source as `parseSpec` and held equal to it by a test. Use it for codegen or for validating specs outside TypeScript:

```ts
import schema from '@thomasfosterau/charts/schema.json' with { type: 'json' };
```

The symbols above are also documented in the TSDoc on each export, which your editor shows on hover. Overview and install are in the [charts README](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/README.md).
