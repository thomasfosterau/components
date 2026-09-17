# @thomasfosterau/components-maps

Maps for [`@thomasfosterau/components`](../components/README.md): a static raster, the interactive [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) surface, the one that upgrades from the first to the second, a plan editor, and the seam between the editor's shapes and a stored GeoJSON geometry.

**Why this is a package and not a family.** A component whose behaviour needs a specific third-party dependency lives in its own package adjacent to `packages/components`, so the core library stays free of it. Here that dependency is `mapbox-gl` — ~800 kB of WebGL — and keeping it out of the core is what lets an application that renders no map never hear about it. The same rules hold as everywhere else in this library: daisyUI semantic classes and never raw colour, every user-facing string a prop with an English default, no Effect, native attributes spread and the caller's `class` merged last.

## Installation

```sh
pnpm add @thomasfosterau/components-maps @thomasfosterau/components mapbox-gl
```

### Peer requirements

| Package | Range | Why |
| --- | --- | --- |
| `mapbox-gl` | `^3.0.0`, **required** | The engine `DynamicMap` (and therefore `Map`) renders with. Required, not optional: installing this package is the decision to render a map. It is still reached only through a dynamic `import()` inside `DynamicMap`'s mount effect, so it lands in the chunk for the route that renders a live map and nowhere else. |
| `svelte` | `^5.30.1` | A declared peer. The components are compiled by your build, not pre-compiled. |
| `@thomasfosterau/components` | `workspace:*` / same release line | A runtime dependency, not a peer — `MapEditor` is built on its `/canvas` entry point. |
| `tailwindcss` | `^4.0.0` | Not a declared peer, but **required**: the components emit Tailwind classes and ship none. |
| `daisyui` | `^5.0.0` | Same — the class vocabulary is daisyUI's (`bg-neutral`, `text-base-content`, `rounded-box`). |

Add this package's `dist/` to Tailwind's sources alongside the core library's, or its classes are never emitted:

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
@source '../node_modules/@thomasfosterau/components-maps/dist';
@plugin "daisyui" {
  themes: false;
}
@import '@thomasfosterau/components/theme.css';
```

Mapbox GL's own stylesheet is imported by `DynamicMap` for its side effect, inside the mount effect — you do not need to import it yourself, and it does not arrive on a page with no live map.

## Components

Everything is exported from the package root: `import { Map, MapEditor, blankShape } from '@thomasfosterau/components-maps'`.

| Component | Purpose | Props | Snippets | ARIA |
| --- | --- | --- | --- | --- |
| `StaticMap` | One raster from the Mapbox Static Images API. No JavaScript, no WebGL; renders on the server | `style`, `view`, `width`, `height`, `accessToken`, `alt` (**required**), `overlay?`, `class?`, plus native `<img>` attributes (`style` excepted — it is the MAP style here) | — | `<img>` named by `alt`. Required rather than defaulted: a map is content, and a decorative empty alt withholds it silently |
| `DynamicMap` | The interactive WebGL half: Mapbox GL, panned and zoomed | `accessToken`, `style`, `camera`, `height?`, `label? = 'Map'`, `panHintLabel? = 'Use two fingers to move the map'`, `unavailableLabel? = 'Map unavailable'`, `class?`, plus native `<div>` attributes | — | `role="application"` named by `label`. When the engine cannot load, replaced by a `<p>` carrying `unavailableLabel` |
| `Map` | The raster first, the live map once the page has hydrated | `accessToken`, `style`, `camera`, `width`, `height`, `alt`, `interactive?`, `panHintLabel?`, `unavailableLabel?`, `class?` | — | one name, `alt`, serves both halves |
| `MapEditor` | A plan-drawing surface: areas, paths and points on a snapping grid, selected, dragged, reshaped and drawn | `doc`, `selected?`, `tool?`, `width?`, `height?`, `label? = 'Plan editor'`, `onchange?`, `onselect?`, `onviewportchange?`, `newShape?`, `class?` | — | inherited from `VectorCanvas`: one `role="application"` surface named by `label` |
| `MapShapeView` | How one area, path or point is drawn. Renders `<g>`, so it lives inside an `<svg>` | `shape`, `selected?`, `editable?` | — | none of its own, deliberately — naming every shape would put hundreds of unreachable nodes inside a widget a screen reader is being told to pass keys through |

```svelte
<script lang="ts">
  import { Map, MapEditor, blankShape, type MapEdit } from '@thomasfosterau/components-maps';
</script>

<!-- Raster first, live map after hydration; interactive={false} pins the raster. -->
<Map accessToken={PUBLIC_MAPBOX_TOKEN} style={{ username: 'mapbox', styleId: 'outdoors-v12' }}
  camera={{ centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 }} width={640} height={360}
  alt="The site's location in Naarm / Melbourne" />

<MapEditor {doc} {selected} {tool} label="Site plan"
  onchange={(next, edit: MapEdit) => {
    doc = next;
    if (edit.committed) history = recordEdit(history, edit.transform, edit.transform.type);
  }}
  onselect={(ids) => { selected = ids; }}
  newShape={(kind, at) => blankShape(kind, crypto.randomUUID(), at)} />
```

`select` picks, drags and reshapes; `pan` moves the viewport; `draw-polygon`/`draw-line` place a corner per press and finish on a double-press or a press back on the first corner — both need a `newShape` supplied by the page, the only place that knows what a new shape should default to. `staticMapUrl` (`static-url.ts`) is the Static Images URL as a plain function; `geojson.ts` gives the exact, invertible conversion between a stored GeoJSON geometry and canvas coordinates (`geoFrame`, `geometryFrame`, `canvasFromGeo`, `geoFromCanvas`, `geometryShapes`, `shapesGeometry`).

## Map editor vocabulary

- **Shape** — an area (`polygon`, closed), a path (`line`, open) or a point (`marker`, a disc). All three sit at a `position` in canvas coordinates; an outline's `points` are relative to it, so moving a shape never rewrites its corners.
- **Grip vs indicator** — `MapShapeView` draws a selected outline's vertices as filled grips when `editable` and as hollow rings otherwise: the affordance matches the capability, so a read-only plan never offers a handle that does nothing.
- **Committed edit** — `MapEditor` reports every pointer move with `committed: false` and the release once with `committed: true`, carrying a `Transform` spanning the whole gesture. A page records history on `committed` alone, so one drag is one undo entry. History and shape creation stay with the page that owns the document; the editor keeps neither.
- **Geo frame** (`geojson.ts`) — how a stored GeoJSON geometry becomes canvas coordinates: subtract an origin, scale by a power of two, negate y. Chosen for exact invertibility, not looks (it is equirectangular, so a plan reads wider than it is away from the equator). A document in this frame wants `grid.snap: false`, or the grid quantises the boundary.

## License

MIT © Thomas Foster
