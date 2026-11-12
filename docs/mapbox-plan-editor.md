# The plan editor

`MapEditor` is a plan-drawing surface: areas, paths and points on a snapping grid, selected, dragged, reshaped and drawn. It keeps no document, no history and no selection; the page owns all three. Props, callbacks, keyboard table and ARIA are in the component's doc comment; this guide is the vocabulary and a worked page.

## Vocabulary

- **Shape**: an area (`polygon`, closed), a path (`line`, open) or a point (`marker`, a disc). All three sit at a `position` in canvas coordinates; an outline's `points` are relative to it, so moving a shape never rewrites its corners.
- **Grip vs indicator**: `MapShapeView` draws a selected outline's vertices as filled grips when `editable` and as hollow rings otherwise. The affordance matches the capability, so a read-only plan never offers a handle that does nothing. An editable outline also gets hollow, dashed midpoint handles, from which a new vertex is dragged out.
- **Committed edit**: `MapEditor` reports every pointer move (or held-arrow repeat) with `committed: false` and the release once with `committed: true`, carrying a `Transform` spanning the whole gesture. A page records history on `committed` alone, so one drag is one undo entry. History and shape creation stay with the page that owns the document.
- **Geo frame**: how a stored GeoJSON geometry becomes canvas coordinates; see [mapbox-geojson.md](https://github.com/thomasfosterau/components/blob/trunk/docs/mapbox-geojson.md).

## A page that owns the document

```svelte
<script lang="ts">
  import { emptyHistory, recordEdit, type VectorDocument } from '@thomasfosterau/components/canvas';
  import { MapEditor, blankShape, type MapShape } from '@thomasfosterau/components-mapbox';

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

<MapEditor {doc} {selected} tool="draw-polygon" label="Site plan"
  onchange={(next, edit) => {
    doc = next;
    if (edit.committed) history = recordEdit(history, edit.transform, edit.transform.type);
  }}
  onselect={(ids) => { selected = ids; }}
  newShape={(kind, at) => blankShape(kind, crypto.randomUUID(), at)} />
```

`blankShape` gives a shape neutral styling; a page with a house style returns its own from `newShape`. Without `newShape`, drawing is off.

## Tools and keys

The pointer gestures per tool, the keyboard path (one Tab stop, `]` / `[` between shapes and handles, arrows to nudge, Enter / Space to edit or place, Delete to remove, Escape to step out), and every announcement string are documented in `MapEditor`'s comment. Every pointer edit has a keyboard path through the same functions and the same `committed` contract.

## Building your own tools

The geometry `MapEditor` uses (`shapeAt`, `vertexAt`, `midpointAt`, `dragShape`, `dragVertex`, `insertVertex`, `removeVertex`, `isDrawable`, `shapePath`, `shapeBounds` and friends) is exported from the package root so a page can build its own tools or tests on the same rules. All take and return canvas coordinates, every edit returns a new document, and a `locked` shape is left untouched.
