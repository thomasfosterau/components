# @thomasfosterau/charts

A portable, renderer-agnostic charting system built around a durable chart specification: the spec and its JSON Schema, a pure TypeScript geometry core, and interpreters for Svelte, ProseMirror and Vega-Lite — plus a Swift package, [`ChartSpecKit`](https://github.com/thomasfosterau/components/tree/trunk/packages/charts/swift/ChartSpecKit), that decodes the same JSON.

The Svelte interpreter of this spec is [`@thomasfosterau/charts/svelte`](#thomasfosterauchartssvelte). It is unrelated to `Chart` from [`@thomasfosterau/components/charts`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/README.md), which takes its own series props rather than this spec.

## Install

```sh
pnpm add @thomasfosterau/charts
```

The spec, core and Vega-Lite entries need nothing else: `d3-scale`, `d3-shape` and `effect` (`^4.0.0`, so it shares your app's copy) are regular dependencies and install with the package. Each framework entry needs its framework, declared as an **optional** peer, so install only the one you import:

| Entry | Install alongside | Peer range |
| --- | --- | --- |
| `@thomasfosterau/charts`, `/core`, `/vega`, `/schema.json` | nothing | — |
| `@thomasfosterau/charts/svelte` | `svelte` | `^5.40.0` |
| `@thomasfosterau/charts/prosemirror` | `prosemirror-model`, `prosemirror-view` | `^1.0.0` each |

```sh
pnpm add @thomasfosterau/charts svelte                               # Svelte
pnpm add @thomasfosterau/charts prosemirror-model prosemirror-view   # ProseMirror
```

The package is ESM-only (`"type": "module"`) and `"sideEffects": false`.

## Architecture

The system has three layers with different lifespans, languages, and owners. **The persisted chart spec is the durable asset and the only cross-platform contract.** Everything else is a per-platform interpreter of that spec.

| Layer | What | Where |
| --- | --- | --- |
| **1 — Spec** | Durable, declarative, language-neutral JSON chart description. Grammar-of-graphics level: mark + encodings + declared types + data reference. Never geometry, pixels, or renderer names. | [`@thomasfosterau/charts`](#entry-points) + [`schema/chart-spec.v1.json`](https://github.com/thomasfosterau/components/blob/trunk/packages/charts/schema/chart-spec.v1.json) |
| **2 — Core** | Pure, synchronous TypeScript. Turns `(spec, box, data)` into scales, dimensions, and geometry. No DOM, no reactivity, no rendering. | [`@thomasfosterau/charts/core`](#entry-points) |
| **3 — Interpreters** | Per-platform renderers: ProseMirror NodeView, Vega-Lite, Swift, Svelte/SvelteKit, Kotlin/Compose, media targets. Each reads the spec and renders it idiomatically. | `/prosemirror`, `/svelte`, `/vega`, [`swift/ChartSpecKit`](https://github.com/thomasfosterau/components/tree/trunk/packages/charts/swift/ChartSpecKit) |

Only the spec (Layer 1) and its emitted JSON Schema may cross a language boundary. Swift and Kotlin interpreters decode the same spec JSON; they never consume the TypeScript core.

### Invariants

- The spec is grammar-level: no geometry, pixels, or renderer names in portable parts.
- Every encoding carries an explicit type (`quantitative` | `ordinal` | `nominal` | `temporal`).
- `specVersion` is present and respected by every interpreter.
- Interaction stays out of the portable spec beyond trivial hints (e.g. `tooltip`).
- The portable subset targets the intersection of native charting envelopes (Swift Charts, Compose); web-only richness lives in `extensions` and degrades gracefully.
- Effect Schema is an implementation detail of the spec entry: no published `.d.mts` names `effect`, and the build fails if one does.

See [§ Capability matrix](#capability-matrix) for which interpreters honour which spec fields.

## Entry points

Each layer is its own entry, so a consumer loads only the interpreter it uses. The frameworks are **optional** peers: install the one your entry needs (see [§ Install](#install)). Every symbol is documented in [§ API reference](#api-reference).

| Entry | What | Peer to install |
| --- | --- | --- |
| `@thomasfosterau/charts` | The portable spec: types, `parseSpec` / `validateSpec` / `encodeSpec`, `SpecValidationError`, data guards | — |
| `@thomasfosterau/charts/core` | Pure TS geometry core: `computeContext(spec, box, data)` → scales, layout, geometry, ticks | — |
| `@thomasfosterau/charts/prosemirror` | ProseMirror integration: chart node schema + edit-time NodeView rendering SVG via the core, and a DOM-free SVG string renderer | `prosemirror-model`, `prosemirror-view` (1.x) |
| `@thomasfosterau/charts/svelte` | Svelte 5 `Chart` component: SSR-compatible SVG rendering via the core, shipped as `.svelte` source | `svelte` (5.40+) |
| `@thomasfosterau/charts/vega` | Spec → Vega-Lite emitter: escape hatch / SSR fallback, validated against the real compiler | — (emits a plain object; bring your own `vega-embed`) |
| `@thomasfosterau/charts/schema.json` | The JSON Schema artifact (draft 2020-12), for codegen and non-TS validators | — |

## Example spec

```json
{
  "specVersion": "1",
  "mark": "line",
  "encoding": {
    "x": { "field": "date", "type": "temporal" },
    "y": { "field": "price", "type": "quantitative" }
  },
  "data": {
    "values": [
      { "date": "2024-01-01", "price": 150 },
      { "date": "2024-01-02", "price": 155.5 }
    ]
  },
  "config": { "title": "Stock price", "tooltip": true }
}
```

### Example: a planting-calendar Gantt (spec 1.1)

A range bar is a `bar` with an end channel: one row per task (`y`), a bar from its start (`x`) to its end (`x2`).

```json
{
  "specVersion": "1.1",
  "mark": "bar",
  "encoding": {
    "y": { "field": "task", "type": "nominal" },
    "x": { "field": "start", "type": "temporal" },
    "x2": { "field": "end", "type": "temporal" },
    "color": { "field": "bed", "type": "nominal" }
  },
  "data": {
    "values": [
      { "task": "Sow tomatoes", "start": "2026-09-01", "end": "2026-10-15", "bed": "Glasshouse" },
      { "task": "Transplant", "start": "2026-10-15", "end": "2026-11-01", "bed": "North bed" },
      { "task": "Harvest", "start": "2026-12-20", "end": "2027-03-01", "bed": "North bed" }
    ]
  },
  "config": { "title": "Planting calendar" }
}
```

The first task is the top row in every interpreter. `ganttSpec` builds the same shape from plain rows, sorting them by start and listing the tasks in that order in `scales.y.domain`:

```ts
import { ganttSpec } from '@thomasfosterau/charts';

const spec = ganttSpec(rows, {
  task: 'task',
  start: 'start',
  end: 'end',
  group: 'bed',
  title: 'Planting calendar',
});
```

### Example: a plant taxonomy (spec 1.1)

A `tree` draws one node per row, joined to the row its `parent` names (`null` for a root). Nodes are laid out tidily: leaves in depth-first order, each parent centred over its children.

```json
{
  "specVersion": "1.1",
  "mark": "tree",
  "encoding": {
    "id": { "field": "id", "type": "nominal" },
    "parent": { "field": "parent", "type": "nominal" },
    "label": { "field": "name", "type": "nominal" },
    "color": { "field": "rank", "type": "nominal" }
  },
  "data": {
    "values": [
      { "id": "solanaceae", "parent": null, "name": "Solanaceae", "rank": "Family" },
      { "id": "solanum", "parent": "solanaceae", "name": "Solanum", "rank": "Genus" },
      { "id": "tomato", "parent": "solanum", "name": "S. lycopersicum", "rank": "Species" },
      { "id": "capsicum", "parent": "solanaceae", "name": "Capsicum", "rank": "Genus" }
    ]
  },
  "tree": { "orientation": "vertical", "linkStyle": "orthogonal" },
  "config": { "title": "Nightshades" }
}
```

Every interpreter also renders the hierarchy as a visually hidden nested list beside the SVG, so assistive technology reads the tree's structure rather than a flat picture.

## API reference

Every exported symbol, grouped by the entry that exports it. Signatures are the published TypeScript ones; all object types are `readonly`.

- [`@thomasfosterau/charts`](#thomasfosteraucharts) — the spec
- [`@thomasfosterau/charts/core`](#thomasfosterauchartscore) — geometry
- [`@thomasfosterau/charts/svelte`](#thomasfosterauchartssvelte)
- [`@thomasfosterau/charts/prosemirror`](#thomasfosterauchartsprosemirror)
- [`@thomasfosterau/charts/vega`](#thomasfosterauchartsvega)
- [`@thomasfosterau/charts/schema.json`](#thomasfosterauchartsschemajson)

### `@thomasfosterau/charts`

The portable spec (Layer 1): plain types, the parse / validate / encode functions, and the data guards. Parsing a `'1'` or `'1.1'` document is strict: unknown keys are rejected, exactly where the [JSON Schema](#thomasfosterauchartsschemajson) sets `additionalProperties: false`. A newer `1.N` document degrades instead: its unknown keys are ignored and reported, and an unknown mark comes back as `unsupported` for the data-table fallback (see [§ Spec versioning](#spec-versioning)).

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
| `SPEC_VERSION` | `'1.1'`: the version a new spec should declare. `parseSpec` reads `'1'` and `'1.1'` strictly, degrades a newer `'1.N'`, and rejects any other `specVersion` (see [§ Spec versioning](#spec-versioning)). |

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

## Capability matrix

For every spec field and mark type, this records which interpreters honour it and how it degrades when unsupported. This is the artifact that keeps multiple interpreters honest and prevents the spec from drifting into web-only assumptions.

**Status legend**

- ✅ — implemented
- 🔵 — planned, expected to be supported natively
- 🟡 — planned, supported with degradation (see notes)
- ⛔ — will not support; degradation behaviour is normative
- — — not applicable

**Interpreter columns**

- **TS core** — `@thomasfosterau/charts/core` (`computeContext`). Web interpreters that sit on the core — the ProseMirror NodeView (`/prosemirror`) and the Svelte component (`/svelte`) — inherit this column.
- **Vega-Lite** — `@thomasfosterau/charts/vega` (`emitVegaLite`), the spec → Vega-Lite emitter (escape hatch / SSR fallback), validated against the real Vega-Lite compiler
- **Swift Charts** — `swift/ChartSpecKit`: the `ChartSpec` Codable decoder plus a swappable SwiftUI renderer whose default backend is Apple Swift Charts. Compiled and tested in CI (`.github/workflows/chartspeckit.yml`); renderer statuses stay 🔵 until each is verified on device
- **Compose** — the planned Kotlin/Android interpreter (charting approach not yet chosen; envelope may constrain further)
- **Media** — planned PDF / raster image / video targets (most likely built on the TS core)

### Marks

| Mark | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `bar` | ✅ | ✅ `bar` | 🔵 `BarMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `line` | ✅ | ✅ `line` | 🔵 `LineMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `point` | ✅ | ✅ `point`/`circle` | 🔵 `PointMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `area` | ✅ | ✅ `area` | 🔵 `AreaMark` | 🔵 | 🔵 | n/a — part of the portable intersection |
| `tree` (spec 1.1) | ✅ tidy layout (`buildTreeGeometry`), plus a visually hidden nested list | ⛔ `VegaLiteEmitError` with reason `'unsupported-mark'` (Vega-Lite has no tree layout; use full Vega's `tree` transform or another interpreter) | 🟡 `TreeLayout` drawn on a SwiftUI `Canvas` outside Swift Charts, the hierarchy as accessibility children | 🟡 custom layout outside the charting library | 🔵 | Render the nested-list fallback (the hierarchy as text), never an empty plot |

The v1 mark set is deliberately the intersection of the native charting vocabularies. `tree` is the one exception (owner decision on #256): no native charting library has it, so every interpreter lays it out itself from the same algorithm, and the matrix rule 2 below is met by the nested-list degradation. New marks (e.g. `rect`, `rule`, `arc`) require a minor `specVersion` bump (see [§ Spec versioning](#spec-versioning)) and a row here **before** implementation.

### Text alternatives

| Feature | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| Data table (#304) | ✅ `buildDataTable` (in `resolveChart`'s `table`); the Svelte and ProseMirror interpreters render it visually hidden beside every chart, and visible in place of a newer `1.N` mark they do not know | ⛔ (Vega-Lite has its own `description` / ARIA; an unknown mark is rendered by a TS interpreter) | 🔵 the same model through `accessibilityChildren`, and as the fallback view | 🔵 | 🔵 | **Normative** for an unknown mark: render the table, never an empty plot |

### Encoding channels

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `encoding.x` | ✅ | ✅ | 🔵 `.value(x:)` | 🔵 | 🔵 | Required for all v1 marks; a spec without `x`/`y` renders an empty plot |
| `encoding.y` | ✅ | ✅ | 🔵 `.value(y:)` | 🔵 | 🔵 | Same as `x` |
| `encoding.x2` (spec 1.1) | ✅ range bars: each bar spans `x` to `x2` in `y`'s bands; an end before its start is normalised; the domain covers both ends and is not forced through zero | ✅ `x2` (field only; shares `x`'s type and scale) | 🔵 `BarMark(xStart:xEnd:y:)` | 🟡 floating bars via a custom column layer; where unavailable, a bar from the axis origin to `x2` | 🔵 | Only with `mark: "bar"` and an `x` of the same `quantitative` or `temporal` type (`parseSpec` rejects anything else). The Gantt / timeline basis |
| `encoding.y2` (spec 1.1) | ✅ vertical range bars, as `x2` | ✅ `y2` | 🔵 `BarMark(x:yStart:yEnd:)` | 🟡 as `x2` | 🔵 | As `x2`, on y |
| `encoding.id` / `encoding.parent` (spec 1.1) | ✅ `tree` only: `id` names each row (unique), `parent` names its parent's id (`null` for a root; several roots make a forest) | ⛔ (no `tree`) | 🟡 `TreeLayout` | 🟡 | 🔵 | Both required with `mark: "tree"` and rejected on every other mark; a `tree` takes no `x` / `y` / `x2` / `y2`. Row errors (duplicate id, unknown parent, cycle) are reported with the row number |
| `encoding.label` (spec 1.1) | ✅ `tree` only: the node text | ⛔ | 🟡 | 🟡 | 🔵 | Ignored → the node's id |
| `encoding.color` | ✅ | ✅ | 🔵 `.foregroundStyle(by:)` | 🔵 | 🔵 | Ignored → single default series colour |
| `encoding.size` | ✅ point only | ✅ | 🟡 `.symbolSize(by:)` (point only) | 🟡 | 🔵 | Ignored → default mark size |
| `encoding.opacity` | 🟡 parsed, not resolved | ✅ | 🟡 limited | 🟡 | 🔵 | Ignored → fully opaque marks |

### Mark options

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `tree.orientation` (spec 1.1) | ✅ `vertical` (roots on top, default) or `horizontal` (roots on the left) | ⛔ | 🟡 | 🟡 | 🔵 | Ignored → vertical |
| `tree.linkStyle` (spec 1.1) | ✅ `orthogonal` (default) or `curved` | ⛔ | 🟡 | 🟡 | 🔵 | Ignored → orthogonal |

`tree` is rejected on any mark other than `tree`.

### Encoding field types

| Type | TS core | Vega-Lite | Swift Charts | Compose | Media | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `quantitative` | ✅ linear scale | ✅ | 🔵 `Double` plottable | 🔵 | 🔵 | Values must be finite JSON numbers |
| `temporal` | ✅ UTC scale | ✅ | 🔵 `Date` plottable | 🔵 | 🔵 | ISO 8601 strings or epoch ms; decoders reconstruct dates from the declared type, never sniff |
| `ordinal` | ✅ band/point scale | ✅ | 🟡 treated as categorical | 🟡 | 🔵 | Ordering is data order; on `y`, the first category is at the top in every interpreter |
| `nominal` | ✅ band/point scale | ✅ | 🔵 `String` plottable | 🔵 | 🔵 | On `y`, the first category is at the top in every interpreter |

### Data

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `data.values` (inline) | ✅ | ✅ inline `values` | 🔵 decoded rows | 🔵 | 🔵 | n/a |
| `data.ref` kind `url` | 🟡 host resolves | ✅ `url` | 🔵 native fetch | 🔵 | 🟡 | Interpreters that cannot fetch render an empty chart with the title |
| `data.ref` kind `query` | 🟡 host resolves | ⛔ host pre-resolves to values | 🟡 host app resolves | 🟡 | 🟡 | Host must resolve before handing to the interpreter |
| `data.ref` kind `node` | 🟡 host resolves | ⛔ host pre-resolves to values | 🟡 host app resolves | 🟡 | 🟡 | Host must resolve before handing to the interpreter |

The TS core never resolves references itself: `computeContext` takes already-resolved rows. Resolution is the host's/interpreter's job in every language.

### Scales

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `scales.x.domain` / `scales.y.domain` | ✅ | ✅ `scale.domain` | 🟡 `chartXScale(domain:)` | 🟡 | 🔵 | Ignored → inferred from data extent |
| `scales.*.nice` | ✅ | ✅ `scale.nice` | ⛔ ignored (Swift Charts nices automatically) | 🟡 | 🔵 | Ignored → interpreter default |
| `scales.*.zero` | ✅ | ✅ `scale.zero` | ⛔ ignored | 🟡 | 🔵 | Ignored → interpreter default (the TS core defaults `zero` to `true` on a bar chart's quantitative axes and `false` elsewhere; an explicit hint wins) |

### Config

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `config.title` | 🟡 not in `ChartContext`; the Svelte and ProseMirror interpreters draw it (rendering is the interpreter's job) | ✅ `title` | 🔵 SwiftUI label | 🔵 | 🔵 | Ignored → untitled chart |
| `config.tooltip` | — (interaction is per-platform) | ✅ `tooltip` | 🟡 maps to selection/`chartOverlay` if the app implements it | 🟡 | ⛔ static output has no tooltips | Ignored entirely; never an error |

### Extensions

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Degradation when unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| `extensions.*` | 🟡 passed through untouched | ⛔ ignored | ⛔ ignored | ⛔ ignored | 🟡 | **Normative:** native interpreters must ignore the whole object. Web interpreters must render correctly when it is absent. |

### Spec versioning

| Field | TS core | Vega-Lite | Swift Charts | Compose | Media | Behaviour |
| --- | --- | --- | --- | --- | --- | --- |
| `specVersion` | ✅ `'1'` and `'1.1'` strictly; a newer `'1.N'` degraded | ✅ (the degraded spec) | 🔵 enforced by decoder (`.v1`, `.v1_1`); degrading a newer `1.N` not yet implemented | 🔵 | 🔵 | See the rule below |

**The rule (owner decision on #255 / #256):** versions are `major.minor`, and `SPEC_VERSION` is the one a new spec should declare (`'1.1'`).

- **A minor version only adds.** Every `'1'` spec is a valid `'1.1'` spec and renders the same. New channels and marks come in a minor version and need a row in this matrix first. `'1.1'` adds `encoding.x2` / `encoding.y2`, the `tree` mark with its `id` / `parent` / `label` channels and `tree` options, and `parseSpec` rejects all of them in a `'1'` spec.
- **Degradation across minors is defined:** an interpreter given a newer `1.x` spec ignores channels it does not know, and renders a mark it does not know through the data-table fallback, never an empty plot. A new major version is a break, and an interpreter rejects it with a clear error.
- **What is implemented (#304):** `parseSpec` / `validateSpec` read `'1'` and `'1.1'` strictly, as before. A `specVersion` of the form `'1.N'` with N above 1 (no leading zero) is read as `'1.1'`: unknown keys anywhere are ignored and listed in the result's `degradation.ignored` with the declared version, the value's `specVersion` is `'1.1'` (so `encodeSpec` writes the known subset, not the original), and the 1.1 rules still hold for what it knows. An unknown `mark` fails validation with an error naming it and carries `unsupported` (`parseSpec` throws `UnsupportedMarkError`); `resolveChart` turns it into an `unsupported` outcome, which the Svelte and ProseMirror interpreters render as a visible data table. `'2'`, `'2.0'` and malformed versions are rejected.
- **The JSON Schema stays strict** (owner decision on #304): `chart-spec.v1.json` describes only the versions it knows and closes every object, so validators keep catching typos. Only the parsers degrade.
- **Interpreters that cannot degrade:** 0.1.0, the first release, shipped strict: it rejects any version above `'1.1'`, so the rule holds only for releases from this one on. ChartSpecKit's decoder does not degrade yet.

### Rules for changing this matrix

1. Every new spec field or mark gets a row here **in the same change** that adds it to the schema.
2. A field may only enter the portable (non-`extensions`) spec if Swift Charts **and** the chosen Compose approach can honour it or degrade from it gracefully.
3. Degradation behaviour is part of the contract: an interpreter that cannot honour a field must do what this matrix says, not improvise.

## Development

From the workspace root (see the [root README](https://github.com/thomasfosterau/components/blob/trunk/README.md) for setup):

```sh
vp run --filter ./packages/charts test:unit    # Vitest under Node (happy-dom where a suite mounts)
vp run --filter ./packages/charts check        # tsc, plus the DOM-free re-check of spec + core
vp run --filter ./packages/charts build        # vp pack -> dist/, then the Effect-leak check
vp run --filter ./packages/charts emit-schema  # regenerate schema/chart-spec.v1.json
```

The JSON Schema artifact at `schema/chart-spec.v1.json` is committed and kept in sync by a test; if you change the spec schema, rerun `emit-schema` and commit the result. The Swift package is tested by its own workflow (`swift test` in `swift/ChartSpecKit`, on macOS).

## License

MIT © Thomas Foster
