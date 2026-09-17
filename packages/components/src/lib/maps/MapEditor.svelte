<!--
  MapEditor — a plan-drawing surface: areas as polygons, paths as lines and
  points as markers, laid out on a snapping grid, selected, dragged, reshaped
  and drawn.

  It is the seam between three things that each know one job: `VectorCanvas`
  owns pan, zoom, the grid and the pointer plumbing; `shapes.ts` owns the
  geometry (what was clicked, where a drag puts it, where a vertex goes);
  `MapShapeView` owns what a shape looks like. What is left here is the wiring
  — which gesture means which of `shapes.ts`'s functions.

  ## Who owns history, and how one drag becomes one undo

  History belongs to whichever page owns the document; this component keeps
  none. It reports enough for a page to KEEP a history: `onchange` hands back
  the new document AND the edit that produced it, as a `Transform` the page can
  push onto an undo stack (`canvas/history.ts`).

  Every pointer move during a drag reports `committed: false`; the release
  reports once with `committed: true` and a transform spanning the WHOLE
  gesture, because the elements it diffs against were snapshotted at the press.
  A page that records only on `committed` therefore gets exactly one undo entry
  per drag, with no coalescing logic of its own and no hidden state here. The
  alternative — a second `onedit` callback beside `onchange` — was rejected as
  two things to keep in step where one will do.

  ## Who creates a shape

  Not this component: the page owning the document is the only place that knows
  what a new shape should default to. So drawing is reached through `newShape`,
  and a caller that supplies none simply cannot draw — which is honest, and is
  the same rule that kept creation out of here before it was implemented at all.
  `blankShape` exists so supplying one is a single line.

  ## ARIA contract

  Inherited from `VectorCanvas`: one `role="application"` surface named by
  `label` (default "Plan editor"). The tool in hand, the selection and the undo
  stack are the page's, so the page owns their controls and their names too —
  which is also the page's opportunity to give a keyboard reader a route to the
  same edits, since a pointer gesture is not one.

  ## A note on the grid

  The point a gesture reports is already snapped when `doc.grid.snap` is set,
  handles included — so a document whose canvas units are geographic (see
  `geojson.ts`) wants `snap: false`, or a 20-unit grid will quantise a boundary
  to some tens of metres.
-->
<script lang="ts">
  import { diffTransform } from '../canvas/history.ts';
  import type { Point, VectorDocument, Viewport } from '../canvas/types.ts';
  import { sortByZIndex } from '../canvas/utils.ts';
  import VectorCanvas from '../canvas/VectorCanvas.svelte';
  import MapShapeView from './MapShapeView.svelte';
  import type { MapEdit, MapShape } from './shapes.ts';
  import {
    dragShape,
    dragVertex,
    insertVertex,
    isDrawable,
    midpointAt,
    removeVertex,
    shapeAt,
    vertexAt,
  } from './shapes.ts';

  /** `select` picks, drags and reshapes; `pan` moves the viewport; the rest draw. */
  type MapTool = 'select' | 'pan' | 'draw-polygon' | 'draw-line';

  interface Props {
    doc: VectorDocument<MapShape>;
    /** Which shapes are selected; the caller owns the set. */
    selected?: ReadonlySet<string>;
    tool?: MapTool;
    width?: number;
    height?: number;
    /** Names the surface for assistive tech. */
    label?: string;
    /**
     * The document after an edit, and the edit itself for an undo stack.
     *
     * `| undefined` on each callback is the `$props()` seam under
     * `exactOptionalPropertyTypes` — see `VectorCanvas`.
     */
    onchange?: ((doc: VectorDocument<MapShape>, edit: MapEdit) => void) | undefined;
    /** The selection after a click; empty when the click landed on nothing. */
    onselect?: ((ids: ReadonlySet<string>) => void) | undefined;
    /** The viewport after a pan or zoom. */
    onviewportchange?: ((viewport: Viewport) => void) | undefined;
    /** The page's defaults for a newly drawn shape. Absent means drawing is off. */
    newShape?: ((kind: 'polygon' | 'line', at: Point) => MapShape) | undefined;
    class?: string | undefined;
  }

  let {
    doc,
    selected = new Set<string>(),
    tool = 'select',
    width = 800,
    height = 600,
    label = 'Plan editor',
    onchange,
    onselect,
    onviewportchange,
    newShape,
    class: className,
  }: Props = $props();

  /** What the pointer is doing between press and release. */
  let gesture = $state<'' | 'shape' | 'vertex'>('');
  /** The shape being dragged or reshaped, and which of its vertices (`-1` for none). */
  let activeId = $state('');
  let activeVertex = $state(-1);
  /** Where the pointer began, and where the thing it grabbed began. */
  let dragFrom = $state<Point>({ x: 0, y: 0 });
  let dragOrigin = $state<Point>({ x: 0, y: 0 });
  /** The ids this gesture is about, and their state when it started. */
  let touched = $state<readonly string[]>([]);
  let before = $state<readonly MapShape[]>([]);
  /** Whether anything has actually changed — a press that never moved is not an edit. */
  let dirty = $state(false);
  /** The shape being drawn a vertex at a time, `''` for none. */
  let drawing = $state('');

  const reset = (): void => {
    gesture = '';
    activeId = '';
    activeVertex = -1;
    touched = [];
    before = [];
    dirty = false;
  };

  /** Report a new document, with the transform from this gesture's starting point. */
  const emit = (next: VectorDocument<MapShape>, committed: boolean): void => {
    const after = next.elements.filter((shape) => touched.includes(shape.id));
    onchange?.(next, { transform: diffTransform(before, after), committed });
  };

  /** Begin a gesture about `shape`, remembering what to diff against at the end. */
  const open = (shape: MapShape, at: Point): void => {
    touched = [shape.id];
    before = [shape];
    activeId = shape.id;
    dragFrom = at;
    dirty = false;
  };

  /**
   * Stop drawing. An outline still short of being a polygon or a line is
   * removed rather than left in the plan — a one-corner area is not an area,
   * and the reader has no handle to fix it with.
   */
  const finishDrawing = (): void => {
    const shape = doc.elements.find((element) => element.id === drawing);
    drawing = '';
    if (shape === undefined || isDrawable(shape)) {
      reset();
      return;
    }
    touched = [shape.id];
    before = [shape];
    emit({ ...doc, elements: doc.elements.filter((element) => element.id !== shape.id) }, true);
    onselect?.(new Set<string>());
    reset();
  };

  /** A press with a drawing tool in hand: place a vertex, or finish. */
  const draw = (point: Point, detail: number): void => {
    if (newShape === undefined) return;
    const current = doc.elements.find((element) => element.id === drawing);

    // A double-press ends the outline, and so does a press back on its first
    // vertex. The second press of a double-press must not ALSO place a vertex,
    // or every finished outline carries a duplicate corner.
    //
    // `detail` is `VectorCanvas`'s count, not `native.detail` — see the note on
    // `countPress` there: a pointer event's own `detail` is 0 in every browser,
    // so reading it would make this branch dead code that a synthetic-event
    // test still passes.
    if (current !== undefined && (detail > 1 || vertexAt(current, point) === 0)) {
      finishDrawing();
      return;
    }

    if (current === undefined) {
      const shape = newShape(tool === 'draw-line' ? 'line' : 'polygon', point);
      touched = [shape.id];
      before = [];
      drawing = shape.id;
      dirty = true;
      emit({ ...doc, elements: [...doc.elements, shape] }, false);
      onselect?.(new Set([shape.id]));
      return;
    }
    open(current, point);
    dirty = true;
    emit(insertVertex(doc, current.id, (current.points ?? []).length, point), false);
  };

  /**
   * Take a handle on one reshapeable shape, and say whether one was taken.
   *
   * One shape rather than the loop, so the search and the decision are separate
   * things: this is where a press on a grip becomes a vertex drag, an alt-press
   * becomes a removal, and a press on a midpoint becomes an insert that carries
   * straight on into a drag.
   */
  const grab = (shape: MapShape, point: Point, native: PointerEvent): boolean => {
    const index = vertexAt(shape, point);
    if (index >= 0) {
      open(shape, point);
      if (native.altKey) {
        dirty = true;
        emit(removeVertex(doc, shape.id, index), true);
        reset();
        return true;
      }
      gesture = 'vertex';
      activeVertex = index;
      dragOrigin = (shape.points ?? [])[index] ?? { x: 0, y: 0 };
      return true;
    }
    const insertion = midpointAt(shape, point);
    if (insertion < 0) return false;
    // The new vertex comes away under the pointer: inserting and dragging are
    // one gesture, so they are one undo.
    open(shape, point);
    gesture = 'vertex';
    activeVertex = insertion;
    dragOrigin = { x: point.x - shape.position.x, y: point.y - shape.position.y };
    dirty = true;
    emit(insertVertex(doc, shape.id, insertion, point), false);
    return true;
  };

  /** The selected shapes a handle could belong to, topmost first. */
  const reshapeable = $derived(
    sortByZIndex(doc.elements)
      .filter((shape) => selected.has(shape.id) && !shape.locked && shape.type !== 'marker')
      .toReversed(),
  );

  /**
   * A press with the select tool: a handle on an already-selected shape first,
   * then the shape under the pointer.
   *
   * Handles win over shapes because the reader aimed at the thing they can see;
   * a grip drawn on top of a neighbouring shape would otherwise pick the shape.
   * Within that, the topmost selected shape wins, for `shapeAt`'s reason.
   */
  const pick = (point: Point, native: PointerEvent): void => {
    if (drawing !== '') finishDrawing();
    if (reshapeable.some((shape) => grab(shape, point, native))) return;

    const id = shapeAt(doc.elements, point);
    onselect?.(id === '' ? new Set<string>() : new Set([id]));
    const shape = doc.elements.find((element) => element.id === id);
    if (shape === undefined) {
      reset();
      return;
    }
    open(shape, point);
    gesture = 'shape';
    dragOrigin = shape.position;
  };

  const interact = (event: {
    readonly phase: 'down' | 'move' | 'up';
    readonly point: Point;
    readonly detail: number;
    readonly native: PointerEvent;
  }): void => {
    if (event.phase === 'down') {
      if (tool === 'draw-polygon' || tool === 'draw-line') {
        draw(event.point, event.detail);
      } else pick(event.point, event.native);
      return;
    }
    if (event.phase === 'up') {
      if (dirty) emit(doc, true);
      reset();
      return;
    }
    if (gesture === 'shape') {
      dirty = true;
      emit(dragShape(doc, activeId, dragOrigin, dragFrom, event.point), false);
    } else if (gesture === 'vertex') {
      dirty = true;
      emit(dragVertex(doc, activeId, activeVertex, dragOrigin, dragFrom, event.point), false);
    }
  };
</script>

<VectorCanvas
  {doc}
  {selected}
  {tool}
  {width}
  {height}
  {label}
  {onviewportchange}
  oninteract={interact}
  class={className}
>
  {#snippet element(shape: MapShape, isSelected: boolean)}
    <MapShapeView {shape} selected={isSelected} editable={tool === 'select' && !shape.locked} />
  {/snippet}
</VectorCanvas>
