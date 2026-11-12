# Canvas

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

`@thomasfosterau/components/canvas`. A low-level toolkit for vector-editing surfaces: pan, zoom, a grid, and pointer gestures reported in canvas coordinates. The application defines its element types, its tools and its renderer — nothing here knows what the elements mean.

```svelte
<script lang="ts">
  import { VectorCanvas, type CanvasElement, type VectorDocument, type Viewport } from '@thomasfosterau/components/canvas';
  let doc = $state<VectorDocument>(plan);
</script>

<VectorCanvas {doc} tool="pan" width={640} height={360} label="Floor plan"
  onviewportchange={(viewport: Viewport) => { doc = { ...doc, viewport }; }}>
  {#snippet element(shape: CanvasElement, selected: boolean)}
    <rect x={shape.position.x} y={shape.position.y} width="120" height="80" fill={shape.fillColor}
          stroke={selected ? 'var(--color-primary)' : shape.strokeColor} />
  {/snippet}
</VectorCanvas>
```

`oninteract` reports `{ phase: 'down'|'move'|'up', tool, point, detail, native }` in CANVAS coordinates, already snapped when `doc.grid.snap` is set; `detail` counts rapid presses at one spot (2 on the second of a double-press, always 1 on `move` and `up`).

The document model is plain data:

| Type | What it is |
| --- | --- |
| `VectorDocument<T>` | `{ version, metadata, viewport: Viewport, grid: GridConfig, elements: readonly T[] }` — the whole editable document, `version` being your schema version for migrations. |
| `CanvasElement` | What every element carries: `{ id: ElementId, type, position: Point, rotation, zIndex, strokeColor, strokeWidth, fillColor, opacity, locked, visible?, label?, metadata? }`. Extend it with your own element types; `type` is the discriminator your renderer switches on. |
| `ElementId` | `string` — an element's stable identity (`generateId()` mints one with `crypto.randomUUID()`). |
| `Point` | `{ x, y }` in canvas coordinates — the document's own space, not the screen's. |
| `Rect` | `{ x, y, width, height }` — an axis-aligned box in canvas coordinates (`boundingBox`, `pointInRect`). |
| `Viewport` | `{ offsetX, offsetY, zoom }` — pan and zoom, `zoom: 1` being 100%. |
| `GridConfig` | `{ visible, size, snap, color }` — the background grid, its cell size in canvas units, whether pointer positions snap to it, and a CSS colour. |
| `Transform<T>` | A change as data: `{ type: 'add' \| 'update' \| 'delete' \| 'batch', elementIds, elements?, previousElements? }`. Carrying the previous elements is what makes it invertible. |
| `HistoryEntry<T>` | One undo-stack entry: `{ transform, timestamp, description? }` (`timestamp` in epoch milliseconds). |
| `History<T>` | `{ past, future }` — the undo stack (oldest first) and the redo stack (nearest first). The caller owns it, as it owns the document. |
| `HistoryStep<T>` | `{ doc, history }` — the result of one `undo` or `redo`. |

`canvas/history.ts` gives pure undo/redo over `Transform`s rather than document snapshots (`emptyHistory`, `applyTransform`, `invertTransform`, `diffTransform`, `recordEdit`, `undo`, `redo`, `HISTORY_LIMIT = 100`) — a history of edits is bounded by the size of the edits, not the size of the plan. `undo(doc, history)` and `redo(doc, history)` return `readonly HistoryStep[]` holding one step, or none when there is nothing to take back, so `const [step] = undo(doc, history)` needs no sentinel. `canvas/utils.ts` gives the geometry underneath it: `screenToCanvas`/`canvasToScreen`, `snapToGrid`, `distance`, `pointInRect`, `pointNearLine`, `sortByZIndex`, `boundingBox`, `rotatePoint`, `panBy`, `zoomAbout`, `generateId`.
