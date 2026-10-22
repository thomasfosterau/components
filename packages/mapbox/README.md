# @thomasfosterau/components-mapbox

Maps for [`@thomasfosterau/components`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/README.md): a static raster, the interactive [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) surface, the one that upgrades from the first to the second, a plan editor, and the seam between the editor's shapes and a stored GeoJSON geometry.

It is a separate package so that an application that renders no map never installs `mapbox-gl` (~800 kB of WebGL). The same rules hold as in the core library: daisyUI semantic classes and never raw colour, every user-facing string a prop with an English default, no Effect, and the caller's `class` merged last. `StaticMap` and `DynamicMap` also spread the native attributes of the element they render; `Map`, `MapEditor` and `MapShapeView` take only the props listed below.

- [Install](#install)
- [Components](#components)
- [Static map URLs](#static-map-urls)
- [Shape geometry](#shape-geometry)
- [GeoJSON seam](#geojson-seam)
- [Types](#types)
- [Map editor vocabulary](#map-editor-vocabulary)

## Install

```sh
pnpm add @thomasfosterau/components-mapbox @thomasfosterau/components mapbox-gl
```

### Peer requirements

| Package | Range | Why |
| --- | --- | --- |
| `mapbox-gl` | `^3.33.0`, **required** | The engine `DynamicMap` (and therefore `Map`) renders with. Required, not optional: installing this package is the decision to render a map. It is still reached only through a dynamic `import()` inside `DynamicMap`'s mount effect, so it lands in the chunk for the route that renders a live map and nowhere else. |
| `svelte` | `^5.40.0` | A declared peer. The components are compiled by your build, not pre-compiled. |
| `@thomasfosterau/components` | the exact version released alongside it | A runtime dependency, not a peer (installed with this package) — `MapEditor` is built on its `/canvas` entry point. |
| `tailwindcss` | `^4.0.0` | Not a declared peer, but **required**: the components emit Tailwind classes and ship none. |
| `daisyui` | `^5.0.0` | Same — the class vocabulary is daisyUI's (`bg-neutral`, `text-base-content`, `rounded-box`). |

Add this package's `dist/` to Tailwind's sources alongside the core library's, or its classes are never emitted:

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@source '../node_modules/@thomasfosterau/components-mapbox/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

Mapbox GL's own stylesheet is imported by `DynamicMap` for its side effect, inside the mount effect — you do not need to import it yourself, and it does not arrive on a page with no live map.

## Components

Everything is exported from the package root, which is the only entry point: `import { Map, MapEditor, blankShape } from '@thomasfosterau/components-mapbox'`.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `StaticMap` | One raster from the Mapbox Static Images API, with a 2× `srcset` entry for high-density displays. No JavaScript, no WebGL; renders on the server | `style`, `view`, `width`, `height`, `accessToken`, `alt` (**required**), `overlay?`, `class?`, plus native `<img>` attributes (`src`, `srcset` and `style` excepted — `style` is the MAP style here; `loading="lazy"` and `decoding="async"` are always set) | — | `<img>` named by `alt`. Required rather than defaulted: a map is content, and a decorative empty alt withholds it silently |
| `DynamicMap` | The interactive WebGL half: Mapbox GL, panned and zoomed. Scroll-zoom stays off except while a finger is down, so the map never swallows the page scroll | `accessToken`, `style`, `camera`, `height? = 400` (the width fills the container), `label? = 'Map'`, `panHintLabel? = 'Use two fingers to move the map'`, `unavailableLabel? = 'Map unavailable'`, `class?`, plus native `<div>` attributes (`style` excepted) | — | `role="application"` named by `label`. When the engine or WebGL cannot load, replaced by a `<p>` carrying `unavailableLabel` |
| `Map` | The raster first, the live map once the page has hydrated | `accessToken`, `style`, `camera`, `width`, `height`, `alt`, `interactive? = true`, `panHintLabel?`, `unavailableLabel?`, `class?` | — | one name, `alt`, serves both halves: the raster's alternative text and the live map's `label` |
| `MapEditor` | A plan-drawing surface: areas, paths and points on a snapping grid, selected, dragged, reshaped and drawn | `doc`, `selected? = new Set()`, `tool? = 'select'` (`'select' \| 'pan' \| 'draw-polygon' \| 'draw-line'`), `width? = 800`, `height? = 600`, `label? = 'Plan editor'`, `onchange?`, `onselect?`, `onviewportchange?`, `newShape?`, `locales?`, the keyboard path's copy (see [§ Keys](#keys)), `class?` | — | inherited from `VectorCanvas`: one `role="application"` Tab stop named by `label` and described by `keysDescription`; `aria-activedescendant` names the focused shape, handle or drawing cursor, and a polite `role="status"` region announces each keyboard edit |
| `MapShapeView` | How one area, path or point is drawn. Renders `<g>`, so it lives inside an `<svg>` | `shape`, `selected? = false`, `editable? = false`, `focus? = ''` (`'shape'` or a handle key such as `'vertex-2'`), `focusId? = ''`, `focusLabel? = ''`, `focusVisible? = false` | — | only the focused part is named (`focusId`, `role="img"`, `focusLabel`), for the editor's `aria-activedescendant`; naming every shape would put hundreds of unreachable nodes inside a widget a screen reader is told to pass keys through. `focusVisible` rings a focused handle |

```svelte
<script lang="ts">
  import { emptyHistory, recordEdit, type VectorDocument } from '@thomasfosterau/components/canvas';
  import { Map, MapEditor, blankShape, type MapShape } from '@thomasfosterau/components-mapbox';

  let { accessToken }: { accessToken: string } = $props();

  let doc = $state<VectorDocument<MapShape>>({
    version: '1',
    metadata: {},
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    grid: { visible: true, size: 20, snap: true, color: 'var(--color-base-300)' },
    elements: [],
  });
  let selected = $state<ReadonlySet<string>>(new Set());
  let history = $state(emptyHistory<MapShape>());
</script>

<!-- Raster first, live map after hydration; interactive={false} pins the raster. -->
<Map {accessToken} style={{ username: 'mapbox', styleId: 'outdoors-v12' }}
  camera={{ centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 }} width={640} height={360}
  alt="The site's location in Naarm / Melbourne" />

<MapEditor {doc} {selected} tool="draw-polygon" label="Site plan"
  onchange={(next, edit) => {
    doc = next;
    if (edit.committed) history = recordEdit(history, edit.transform, edit.transform.type);
  }}
  onselect={(ids) => { selected = ids; }}
  newShape={(kind, at) => blankShape(kind, crypto.randomUUID(), at)} />
```

`select` picks, drags and reshapes (drag a grip to move a vertex, alt-press a grip to remove it, drag a midpoint handle to insert one); `pan` moves the viewport; `draw-polygon`/`draw-line` place a corner per press and finish on a double-press or a press back on the first corner — both need a `newShape` supplied by the page, the only place that knows what a new shape should default to. An outline finished short of a drawable shape is removed. `MapEditor` callbacks:

| Callback | Signature | When |
| --- | --- | --- |
| `onchange` | `(doc: VectorDocument<MapShape>, edit: MapEdit) => void` | Every change: each pointer move with `edit.committed: false`, the release once with `committed: true` |
| `onselect` | `(ids: ReadonlySet<string>) => void` | A press picks a shape (or nothing — an empty set), or drawing starts or discards a shape |
| `onviewportchange` | `(viewport: Viewport) => void` | A pan or zoom |
| `newShape` | `(kind: 'polygon' \| 'line', at: Point) => MapShape` | The first press of a drawing gesture. Absent means drawing is off |

`VectorDocument`, `Viewport` and `Point` are the core library's, from [`@thomasfosterau/components/canvas`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/README.md).

### Keys

Every pointer edit has a keyboard path through the same functions and the same `committed` contract. The surface is one Tab stop; focus stays on it, and `aria-activedescendant` names the part being worked on.

| Key | Select tool, shape level | Select tool, handle level |
| --- | --- | --- |
| `]` / `[` | select the next / previous shape (paint order) | focus the next / previous handle: vertices and edge midpoints, in outline order |
| Arrows (Shift: ×5) | move the shape one grid step | move the vertex; on a midpoint, add a vertex there and move it (one undo) |
| Enter / Space | go into the shape's handles (areas and paths) | on a midpoint, add a vertex and focus it |
| Delete / Backspace | — | remove the vertex, down to 3 for an area and 2 for a path (a refusal is announced) |
| Escape | clear the selection; a second Escape passes through to the page | back to the shape level |

With a drawing tool, a cursor starts at the centre of the view: arrows move it, Enter or Space places a vertex (Enter back on the first vertex finishes), and Escape finishes the outline at once, discarding one still too short. Switching tool mid-outline finishes it too. With the pan tool the arrows pan, and `+` / `-` zoom with any tool (both `VectorCanvas`'s). Ctrl, Alt and Meta chords are left to the page. A held arrow is one edit: each repeat reports `committed: false`, and the release (or a blur, or a pointer press) commits once, with the same transform the matching pointer drag commits.

Every string is a prop with an English default; coordinates are formatted with `locales` (the runtime default when absent):

| Prop | Signature | Default |
| --- | --- | --- |
| `keysDescription` | `string` | how the keys work, in one paragraph |
| `shapeLabel` | `({ kind, label, locked }) => string` | `'Lawn, area, locked'` (`polygon` → area, `line` → path, `marker` → point) |
| `vertexLabel` | `(index, count, x, y) => string` | `'Vertex 2 of 4, at 40, 20'` |
| `midpointLabel` | `(from, to) => string` | `'Midpoint between vertices 2 and 3; Enter adds a vertex here'` |
| `cursorLabel` | `(x, y) => string` | `'Drawing cursor at 40, 20'` |
| `movedMessage` | `(x, y) => string` | `'40, 20'` |
| `lockedMessage` | `string` | `'Locked; it cannot be changed'` |
| `vertexAddedMessage` | `(index, count) => string` | `'Vertex 3 of 5 added'` |
| `vertexRemovedMessage` | `(count) => string` | `'Vertex removed; 4 left'` |
| `vertexKeptMessage` | `(minimum) => string` | `'Not removed: this outline needs at least 3 vertices'` |
| `outlineFinishedMessage` | `string` | `'Outline finished'` |
| `outlineDiscardedMessage` | `string` | `'Outline too short to keep; discarded'` |
| `drawingOffMessage` | `string` | `'Drawing is not available here'` |

## Static map URLs

```ts
staticMapUrl(request: StaticMapRequest): string
```

The Mapbox Static Images API URL `StaticMap` renders, as a plain function — for an `og:image`, an email, or anywhere else a map has to be a URL. It appends the access token as `access_token`, rounds `width` and `height` to whole pixels, adds `@2x` when `retina` is set, and `encodeURIComponent`s the GeoJSON overlay (the path grammar reads its commas as separators otherwise).

```ts
import { staticMapUrl } from '@thomasfosterau/components-mapbox';

const src = staticMapUrl({
  style: { username: 'mapbox', styleId: 'streets-v12' },
  view: { kind: 'camera', camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 14 } },
  width: 600,
  height: 400,
  accessToken,
});
```

| Type | Shape |
| --- | --- |
| `StaticMapRequest` | `style: MapStyle`, `view: StaticView`, `width` and `height` in CSS pixels (the endpoint caps each at 1280), `accessToken` (a public-scope token), `overlay?: unknown` (a GeoJSON value), `retina?: boolean` |
| `StaticView` | How the raster is framed: `{ kind: 'camera', camera: MapCamera }` (`lon,lat,zoom,bearing,pitch`, bearing and pitch defaulting to 0), `{ kind: 'bbox', bbox: BoundingBox }` (fitted to the requested size), or `{ kind: 'auto' }` (the endpoint frames the overlay; meaningless without one) |

## Shape geometry

Pure functions over `MapShape` and `VectorDocument<MapShape>` — the geometry `MapEditor` uses to draw, hit-test and edit, exported so a page can build its own tools, keyboard routes or tests on the same rules. Every function takes and returns **canvas** coordinates, except where noted as shape-local. Every edit returns a new document and leaves a `locked` shape untouched.

| Export | Signature | What it does |
| --- | --- | --- |
| `HANDLE_TOLERANCE` | `6` | How near, in canvas units, a pointer must come to a vertex grip or midpoint handle to take it — the default `tolerance` of `vertexAt` and `midpointAt`. Canvas units, so it scales with the zoom exactly as the drawn handles do |
| `blankShape` | `(type: MapShape['type'], id: string, at: Point) => MapShape` | A new shape at `at` with neutral styling (`currentColor` stroke, no fill); an outline starts with one vertex at its position, a marker has no `points`. What a `newShape` callback returns when the page has no styling of its own |
| `shapePath` | `(shape: MapShape) => string` | The SVG path `d` of an outline, in shape-local coordinates: closed (`Z`) for a polygon, open for a line, `''` for a marker or an outline under two vertices |
| `shapeVertices` | `(shape: MapShape) => readonly Point[]` | The outline's vertices in canvas coordinates — `points` offset by `position`. Rotation is ignored |
| `shapeBounds` | `(shape: MapShape) => Rect` | The shape's axis-aligned box. A marker (or an outline with no vertices) is a square of its `radius`, default 6, around its position |
| `shapeAt` | `(shapes: readonly MapShape[], point: Point) => string` | The id of the topmost shape under `point`, or `''` for none. Highest `zIndex` wins; a line is hit within 5 units of a segment, a polygon or marker by its box |
| `vertexAt` | `(shape: MapShape, point: Point, tolerance = HANDLE_TOLERANCE) => number` | The index of the vertex under `point`, or `-1`. Where vertices overlap, the last one wins |
| `edgeMidpoints` | `(shape: MapShape) => readonly { index: number; point: Point }[]` | The midpoint of every edge in shape-local coordinates, each with the index a vertex inserted there would take. A polygon includes its closing edge; a line has one fewer; under two vertices, or for a marker, it is empty |
| `midpointAt` | `(shape: MapShape, point: Point, tolerance = HANDLE_TOLERANCE) => number` | The insertion index of the edge midpoint under `point`, or `-1` — the index `insertVertex` expects |
| `dragShape` | `(doc, id: string, origin: Point, from: Point, to: Point) => VectorDocument<MapShape>` | The document with shape `id` moved to `origin + (to − from)`. Pass the shape's `position` at the start of the drag as `origin`: anchoring to the start, rather than accumulating per-move deltas, means a dropped pointer move cannot drift it |
| `dragVertex` | `(doc, id: string, index: number, origin: Point, from: Point, to: Point) => VectorDocument<MapShape>` | The document with vertex `index` moved to `origin + (to − from)`, where `origin` is the vertex's shape-local position at the start of the drag. An index outside the outline, or a marker, leaves the document unchanged |
| `insertVertex` | `(doc, id: string, index: number, at: Point) => VectorDocument<MapShape>` | The document with a vertex inserted at `index`, its position taken from the canvas point `at`. An index past the end appends, which is how drawing adds corners |
| `removeVertex` | `(doc, id: string, index: number) => VectorDocument<MapShape>` | The document with vertex `index` removed — unless that would take a polygon below three vertices or a line below two, in which case the document is returned unchanged |
| `isDrawable` | `(shape: MapShape) => boolean` | Whether an outline has enough vertices to be its kind: three for a polygon, two for a line; a marker always is |

`doc` is `VectorDocument<MapShape>` throughout. `Point` and `Rect` are the core library's canvas types.

## GeoJSON seam

How a stored GeoJSON geometry becomes shapes `MapEditor` can edit, and back, through a [geo frame](#map-editor-vocabulary): `canvas = (degrees − origin) × 2^scaleExponent`, with y negated. The frame uses only operations that are exact (or, for the subtraction, exact for coordinates within a factor of two of the origin), so a geometry nobody has edited comes back out with the numbers it went in with. It is equirectangular, so a plan reads wider than it is away from the equator; and a document in this frame wants `grid.snap: false`, or the grid quantises the boundary.

| Export | Signature | What it does |
| --- | --- | --- |
| `DEFAULT_SCALE_EXPONENT` | `20` | The default `scaleExponent`: 2²⁰ canvas units to the degree, about 9.4 units to the metre at the equator — small enough that a whole site fits `VectorCanvas`'s 0.1–10 zoom range unscaled |
| `geoFrame` | `(origin: LngLat, scaleExponent = DEFAULT_SCALE_EXPONENT) => GeoFrame` | A frame anchored at `origin` |
| `geometryFrame` | `(geometry: GeoGeometry, scaleExponent = DEFAULT_SCALE_EXPONENT) => readonly GeoFrame[]` | A frame anchored on the geometry's own first coordinate, as a zero- or one-element array: empty when there is no coordinate to anchor on, so `const [frame] = geometryFrame(g)` is the check |
| `canvasFromGeo` | `(frame: GeoFrame, position: GeoPosition) => Point` | One GeoJSON position in canvas coordinates |
| `geoFromCanvas` | `(frame: GeoFrame, point: Point) => GeoPosition` | One canvas point back as a `[longitude, latitude]` position — `canvasFromGeo`'s inverse |
| `geometryShapes` | `(frame: GeoFrame, geometry: GeoGeometry, newId = generateId) => GeometryImport` | The geometry as editable shapes: `Point`/`MultiPoint` become markers, `LineString`/`MultiLineString` lines, `Polygon`/`MultiPolygon` polygons (the repeated closing position dropped). Anything it cannot represent is reported in `unrepresentable` rather than flattened: interior rings are dropped and reported; a position with an altitude, a position short of two ordinates, or `coordinates` nested at the wrong depth for the `type` yields no shapes at all |
| `shapesGeometry` | `(frame: GeoFrame, shapes: readonly MapShape[]) => readonly GeoGeometry[]` | The shapes as one geometry, as a zero- or one-element array: one marker is a `Point`, several a `MultiPoint`, and likewise `LineString`/`MultiLineString` and `Polygon`/`MultiPolygon` (rings closed by repeating the first position). Empty when there are no shapes, the kinds are mixed, or an outline is not `isDrawable` |

```ts
import {
  geometryFrame,
  geometryShapes,
  shapesGeometry,
  type GeoGeometry,
} from '@thomasfosterau/components-mapbox';

declare const stored: GeoGeometry;

const [frame] = geometryFrame(stored);
if (frame !== undefined) {
  const { shapes, unrepresentable } = geometryShapes(frame, stored);
  if (unrepresentable.length === 0) {
    // …edit `shapes` in a MapEditor, then:
    const [saved] = shapesGeometry(frame, shapes);
  }
}
```

| Type | Shape |
| --- | --- |
| `GeoPosition` | `readonly number[]` — `[longitude, latitude]`, optionally with an altitude |
| `GeoCoordinates` | A `coordinates` value at any of GeoJSON's four nesting depths: `GeoPosition`, `GeoPosition[]`, `GeoPosition[][]` or `GeoPosition[][][]` |
| `GeoGeometry` | `{ type, coordinates: GeoCoordinates }`, `type` one of `'Point'`, `'MultiPoint'`, `'LineString'`, `'MultiLineString'`, `'Polygon'`, `'MultiPolygon'`. `GeometryCollection` is not supported |
| `GeoFrame` | `{ origin: LngLat; scaleExponent: number }` — the scale is `2 ** scaleExponent`, given as an exponent so it is always a power of two |
| `GeometryImport` | `{ shapes: readonly MapShape[]; unrepresentable: readonly Unrepresentable[] }` — `unrepresentable` is deduplicated, and empty when the whole geometry came across |
| `Unrepresentable` | `'interior-ring'` (a polygon's holes), `'altitude'` (a third ordinate; the editor is flat) or `'malformed'` (`coordinates` nested at a depth its `type` does not describe, or a position short of two ordinates) |

## Types

| Type | Shape |
| --- | --- |
| `LngLat` | `{ longitude: number; latitude: number }` — a WGS 84 position; latitude within the Web Mercator limit of ±85.0511 |
| `BoundingBox` | `{ min: LngLat; max: LngLat }` — the south-west and north-east corners |
| `MapStyle` | `{ username: string; styleId: string }` — the style's Mapbox account (`mapbox` for the stock styles) and its id (`streets-v12`, `outdoors-v12`, or a custom one) |
| `MapCamera` | `{ centre: LngLat; zoom: number; bearing?: number; pitch?: number }` — zoom 0–22, bearing in degrees clockwise from north, pitch in degrees of tilt 0–60 |
| `MapShape` | A `CanvasElement` (from `@thomasfosterau/components/canvas`) with `type: 'polygon' \| 'line' \| 'marker'`, `points?: readonly Point[]` (an outline's vertices, relative to `position`) and `radius?: number` (a marker's, in canvas units) |
| `MapEdit` | `{ transform: Transform<MapShape>; committed: boolean }` — what `onchange` reports beside each new document; see [committed edit](#map-editor-vocabulary) |
| `StaticMapRequest`, `StaticView` | See [Static map URLs](#static-map-urls) |
| `GeoPosition`, `GeoCoordinates`, `GeoGeometry`, `GeoFrame`, `GeometryImport`, `Unrepresentable` | See [GeoJSON seam](#geojson-seam) |

## Map editor vocabulary

- **Shape** — an area (`polygon`, closed), a path (`line`, open) or a point (`marker`, a disc). All three sit at a `position` in canvas coordinates; an outline's `points` are relative to it, so moving a shape never rewrites its corners.
- **Grip vs indicator** — `MapShapeView` draws a selected outline's vertices as filled grips when `editable` and as hollow rings otherwise: the affordance matches the capability, so a read-only plan never offers a handle that does nothing. An editable outline also gets hollow, dashed midpoint handles, from which a new vertex is dragged out.
- **Committed edit** — `MapEditor` reports every pointer move (or held-arrow repeat) with `committed: false` and the release once with `committed: true`, carrying a `Transform` spanning the whole gesture. A page records history on `committed` alone, so one drag is one undo entry. History and shape creation stay with the page that owns the document; the editor keeps neither.
- **Geo frame** — how a stored GeoJSON geometry becomes canvas coordinates: subtract an origin, scale by a power of two, negate y. Chosen for exact invertibility, not looks (it is equirectangular, so a plan reads wider than it is away from the equator). A document in this frame wants `grid.snap: false`, or the grid quantises the boundary.

## License

MIT © Thomas Foster
