<!-- @component
A plan-drawing surface for areas, paths and points on a snapping grid: select, drag, reshape and draw.
-->
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
  `label` (default "Plan editor"), described by `keysDescription`, with
  `aria-activedescendant` on the part being worked on (§ Keys). What an edit
  did is announced in a polite `role="status"` region beside it. The tool in
  hand, the selection and the undo stack are the page's, so the page owns
  their controls and their names.

  ## A note on the grid

  The point a gesture reports is already snapped when `doc.grid.snap` is set,
  handles included — so a document whose canvas units are geographic (see
  `geojson.ts`) wants `snap: false`, or a 20-unit grid will quantise a boundary
  to some tens of metres.

  ## Keys

  Every edit a pointer can make, a keyboard can make too, through the same
  `shapes.ts` functions and the same `committed` contract. The surface is one
  Tab stop; focus stays on it and `aria-activedescendant` names the part being
  worked on, so the arrow keys never scroll the page. There are two levels —
  the selected SHAPE, and one of its HANDLES — and Escape steps out of the
  inner one.

  | Key                | Select tool, shape level            | Select tool, handle level                                  |
  | ------------------ | ----------------------------------- | ---------------------------------------------------------- |
  | `]` / `[`          | select the next / previous shape    | focus the next / previous handle                           |
  | Arrow keys         | move the shape a grid step          | move the vertex (on a midpoint: add one there and move it) |
  | Shift + arrow      | the same, five grid steps           | the same, five grid steps                                  |
  | Enter / Space      | edit its vertices (area or path)    | on a midpoint: add a vertex there                          |
  | Delete / Backspace | —                                   | remove the focused vertex                                  |
  | Escape             | clear the selection                 | back to the shape level                                    |

  With a drawing tool, a cursor appears at the centre of the view: the arrow
  keys move it a grid step (Shift: five), Enter or Space places a vertex there —
  or finishes, when the cursor is back on the first one — and Escape finishes
  the outline on the spot, discarding it if it is still too short to be one.
  Switching tool mid-outline finishes it the same way. With the pan tool the
  arrow keys pan, and `+` / `-` zoom with any tool; those two are
  `VectorCanvas`'s.

  Why these keys. The APG's grid pattern is the model — a navigation level, an
  editing level entered with Enter and left with Escape — but the arrow keys
  belong to nudging, as in every drawing tool, so stepping between items needs
  other keys. Tab would trap the reader inside the surface; brackets are free,
  are on every layout's home block, and are what several editors already use
  for "next/previous". Ctrl, Alt and Meta chords are left alone, so the page's
  own Ctrl+Z still reaches the page.

  One held arrow is one edit: the first press snapshots the shape exactly as a
  pointer press does, each repeat reports `committed: false`, and the key's
  release (or the surface losing focus, or a pointer press) reports
  `committed: true` with the transform spanning the whole run. A tap is a
  one-step run. Adding and removing a vertex are single presses, committed on
  the press.

  Every string is a prop with an English default (`keysDescription`, the
  `…Label` names, the `…Message` announcements). Coordinates in them are
  formatted with `locales`; this package cannot reach the core's
  `getComponentsContext()` (it consumes only `/canvas`), so there is no
  context fallback, and an absent `locales` means the runtime's default.

  The keyboard path was first built in the owner's app
  (thomasfosterau/gardeneria#1188, thomasfosterau/gardeneria#1540) and
  upstreamed here (#135).
-->
<script lang="ts">
  import {
    diffTransform,
    screenToCanvas,
    snapToGrid,
    sortByZIndex,
    VectorCanvas,
    type Point,
    type VectorDocument,
    type Viewport,
  } from '@thomasfosterau/components/canvas';
  import { untrack } from 'svelte';
  import MapShapeView from './MapShapeView.svelte';
  import type { MapEdit, MapShape } from './shapes.ts';
  import {
    dragShape,
    dragVertex,
    edgeMidpoints,
    insertVertex,
    isDrawable,
    midpointAt,
    MINIMUM_VERTICES,
    removeVertex,
    shapeAt,
    shapeVertices,
    vertexAt,
  } from './shapes.ts';

  /** `select` picks, drags and reshapes; `pan` moves the viewport; the rest draw. */
  type MapTool = 'select' | 'pan' | 'draw-polygon' | 'draw-line';

  interface Props {
    /** The plan to edit; the caller owns it and applies `onchange`. */
    doc: VectorDocument<MapShape>;
    /**
     * Which shapes are selected; the caller owns the set.
     * @defaultValue an empty set
     */
    selected?: ReadonlySet<string> | undefined;
    /**
     * The active tool.
     * @defaultValue `'select'`
     */
    tool?: MapTool | undefined;
    /**
     * Viewport width in CSS pixels.
     * @defaultValue `800`
     */
    width?: number | undefined;
    /**
     * Viewport height in CSS pixels.
     * @defaultValue `600`
     */
    height?: number | undefined;
    /**
     * Names the surface for assistive tech.
     * @defaultValue `'Plan editor'`
     */
    label?: string | undefined;
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
    /**
     * Locales for the coordinates the keyboard path announces.
     * @defaultValue the runtime's default locale
     */
    locales?: Intl.LocalesArgument | undefined;
    /** Describes the surface's keys, through `aria-describedby`. */
    keysDescription?: string | undefined;
    /**
     * Names the focused shape. `kind` is its type: `polygon`, `line` or `marker`.
     * @defaultValue e.g. `'Lawn, area, locked'`
     */
    shapeLabel?:
      | ((shape: { readonly kind: string; readonly label: string; readonly locked: boolean }) => string)
      | undefined;
    /**
     * Names the focused vertex; `index` is 1-based and the coordinates are formatted.
     * @defaultValue `'Vertex 2 of 4, at 40, 20'`
     */
    vertexLabel?: ((index: number, count: number, x: string, y: string) => string) | undefined;
    /**
     * Names the focused edge midpoint, by the 1-based vertices either side of it.
     * @defaultValue `'Midpoint between vertices 2 and 3; Enter adds a vertex here'`
     */
    midpointLabel?: ((from: number, to: number) => string) | undefined;
    /**
     * Names the drawing cursor, and is announced as it moves.
     * @defaultValue `'Drawing cursor at 40, 20'`
     */
    cursorLabel?: ((x: string, y: string) => string) | undefined;
    /**
     * Announced after a keyboard move: where the shape or vertex now is.
     * @defaultValue `'40, 20'`
     */
    movedMessage?: ((x: string, y: string) => string) | undefined;
    /**
     * Announced when a key tries to change a locked shape.
     * @defaultValue `'Locked; it cannot be changed'`
     */
    lockedMessage?: string | undefined;
    /**
     * Announced after a vertex is added; `index` is 1-based.
     * @defaultValue `'Vertex 3 of 5 added'`
     */
    vertexAddedMessage?: ((index: number, count: number) => string) | undefined;
    /**
     * Announced after a vertex is removed, with how many are left.
     * @defaultValue `'Vertex removed; 4 left'`
     */
    vertexRemovedMessage?: ((count: number) => string) | undefined;
    /**
     * Announced when a removal is refused because the outline is at its minimum.
     * @defaultValue `'Not removed: this outline needs at least 3 vertices'`
     */
    vertexKeptMessage?: ((minimum: number) => string) | undefined;
    /**
     * Announced when an outline is finished.
     * @defaultValue `'Outline finished'`
     */
    outlineFinishedMessage?: string | undefined;
    /**
     * Announced when an outline too short to keep is discarded.
     * @defaultValue `'Outline too short to keep; discarded'`
     */
    outlineDiscardedMessage?: string | undefined;
    /**
     * Announced when a key tries to draw and `newShape` is absent.
     * @defaultValue `'Drawing is not available here'`
     */
    drawingOffMessage?: string | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  const SHAPE_NOUNS: Record<string, string> = { polygon: 'area', line: 'path', marker: 'point' };

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
    locales,
    keysDescription = 'Right and left bracket choose the next or previous shape; ' +
      'arrow keys move it, Shift for a larger step. ' +
      'Enter edits its vertices: brackets step between them, arrow keys move one, ' +
      'Enter on a midpoint adds one, Delete removes one. ' +
      'With a drawing tool, arrow keys move the cursor, Enter places a vertex and Escape finishes. ' +
      'Escape steps back out.',
    shapeLabel = ({ kind, label: name, locked }) => {
      const noun = SHAPE_NOUNS[kind] ?? 'shape';
      const named = name === '' ? noun : `${name}, ${noun}`;
      return locked ? `${named}, locked` : named;
    },
    vertexLabel = (index, count, x, y) => `Vertex ${index} of ${count}, at ${x}, ${y}`,
    midpointLabel = (from, to) =>
      `Midpoint between vertices ${from} and ${to}; Enter adds a vertex here`,
    cursorLabel = (x, y) => `Drawing cursor at ${x}, ${y}`,
    movedMessage = (x, y) => `${x}, ${y}`,
    lockedMessage = 'Locked; it cannot be changed',
    vertexAddedMessage = (index, count) => `Vertex ${index} of ${count} added`,
    vertexRemovedMessage = (count) => `Vertex removed; ${count} left`,
    vertexKeptMessage = (minimum) => `Not removed: this outline needs at least ${minimum} vertices`,
    outlineFinishedMessage = 'Outline finished',
    outlineDiscardedMessage = 'Outline too short to keep; discarded',
    drawingOffMessage = 'Drawing is not available here',
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

  /** Hydration-safe, so the ids `aria-activedescendant` names match after SSR. */
  const uid = $props.id();

  /** The arrow key whose nudge is in progress, `''` for none (see § Keys). */
  let heldKey = $state('');
  /** How far the held nudge has moved, in canvas units. */
  let keyDelta = $state<Point>({ x: 0, y: 0 });
  /** Which handle of which shape has keyboard focus; `key` is `''` at the shape level. */
  let handleFocus = $state({ id: '', key: '' });
  let surfaceFocused = $state(false);
  /** The drawing cursor, and whether it has been put anywhere yet. */
  let cursor = $state<Point>({ x: 0, y: 0 });
  let cursorPlaced = $state(false);
  /** The live region's text: what the last keyboard edit did. */
  let announcement = $state('');

  const reset = (): void => {
    gesture = '';
    activeId = '';
    activeVertex = -1;
    touched = [];
    before = [];
    dirty = false;
    heldKey = '';
    keyDelta = { x: 0, y: 0 };
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
      if (shape !== undefined) announcement = outlineFinishedMessage;
      reset();
      return;
    }
    announcement = outlineDiscardedMessage;
    touched = [shape.id];
    before = [shape];
    emit({ ...doc, elements: doc.elements.filter((element) => element.id !== shape.id) }, true);
    onselect?.(new Set<string>());
    reset();
  };

  /**
   * A press with a drawing tool in hand: place a vertex, or finish.
   *
   * `committed` is false for a pointer, whose release commits, and true for a
   * key, which has no release worth waiting for.
   */
  const draw = (point: Point, detail: number, committed: boolean): void => {
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
    if (current === undefined) startOutline(newShape(outlineKind(), point), committed);
    else if (detail > 1 || vertexAt(current, point) === 0) finishDrawing();
    else {
      open(current, point);
      dirty = true;
      emit(insertVertex(doc, current.id, (current.points ?? []).length, point), committed);
    }
    if (committed) reset();
  };

  const outlineKind = (): 'polygon' | 'line' => (tool === 'draw-line' ? 'line' : 'polygon');

  /** Put the page's new shape into the plan and select it: the outline's first vertex. */
  const startOutline = (shape: MapShape, committed: boolean): void => {
    touched = [shape.id];
    before = [];
    drawing = shape.id;
    dirty = true;
    emit({ ...doc, elements: [...doc.elements, shape] }, committed);
    onselect?.(new Set([shape.id]));
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
        // At the floor `removeVertex` hands the document back untouched, and
        // an unchanged document is not an edit worth an undo step.
        const next = removeVertex(doc, shape.id, index);
        if (next !== doc) emit(next, true);
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

  const drawingTool = $derived(tool === 'draw-polygon' || tool === 'draw-line');

  // A drawing abandoned by switching tool is finished then and there, rather
  // than on whatever the next press happens to be.
  $effect(() => {
    if (drawing === '' || drawingTool) return;
    untrack(finishDrawing);
  });

  /** Whether the keyboard may reach this shape's vertices. */
  const reshapes = (shape: MapShape): boolean =>
    tool === 'select' && !shape.locked && shape.type !== 'marker';

  /** The shape the keyboard acts on: the topmost selected one. */
  const target = $derived(sortByZIndex(doc.elements).findLast((shape) => selected.has(shape.id)));

  /** The target's handles in the order `]` walks them: each vertex, then the edge after it. */
  const handleKeys = $derived.by((): readonly string[] => {
    if (target === undefined || !reshapes(target)) return [];
    const midpoints = new Set(edgeMidpoints(target).map((midpoint) => midpoint.index));
    return (target.points ?? []).flatMap((_point, index) =>
      midpoints.has(index + 1) ? [`vertex-${index}`, `midpoint-${index + 1}`] : [`vertex-${index}`],
    );
  });

  /** The focused handle's key, or `''` at the shape level — stale focus reads as none. */
  const focusedKey = $derived(
    target !== undefined && handleFocus.id === target.id && handleKeys.includes(handleFocus.key)
      ? handleFocus.key
      : '',
  );

  /** A handle key's kind and index: `vertex-2` is vertex 2. */
  const parseKey = (key: string): { readonly kind: string; readonly index: number } => {
    const [kind = '', index = '-1'] = key.split('-');
    return { kind, index: Number(index) };
  };

  const numberFormat = $derived(new Intl.NumberFormat(locales, { maximumFractionDigits: 2 }));
  const format = (value: number): string => numberFormat.format(value);

  /** What assistive tech hears for one part of a shape. */
  const describe = (shape: MapShape, key: string): string => {
    if (key === 'shape') {
      return shapeLabel({ kind: shape.type, label: shape.label ?? '', locked: shape.locked });
    }
    const { kind, index } = parseKey(key);
    const vertices = shapeVertices(shape);
    if (kind === 'vertex') {
      const vertex = vertices[index] ?? ORIGIN;
      return vertexLabel(index + 1, vertices.length, format(vertex.x), format(vertex.y));
    }
    return midpointLabel(index, index === vertices.length ? 1 : index + 1);
  };

  const cursorShown = $derived(drawingTool && surfaceFocused && cursorPlaced);
  const cursorId = $derived(`${uid}-cursor`);
  /** The focused part of the target, as `MapShapeView` names it. */
  const targetFocus = $derived(focusedKey === '' ? 'shape' : focusedKey);
  const targetFocusId = $derived(
    target === undefined ? '' : `${uid}-${doc.elements.indexOf(target)}-${targetFocus}`,
  );
  const activedescendant = $derived(
    cursorShown ? cursorId : drawingTool || target === undefined ? '' : targetFocusId,
  );

  /** One arrow key's direction, in grid steps. */
  const ARROWS = new Map<string, Point>([
    ['ArrowLeft', { x: -1, y: 0 }],
    ['ArrowRight', { x: 1, y: 0 }],
    ['ArrowUp', { x: 0, y: -1 }],
    ['ArrowDown', { x: 0, y: 1 }],
  ]);
  /** How many grid steps Shift moves at once. */
  const COARSE_STEPS = 5;

  const step = (direction: Point, coarse: boolean): Point => {
    const size = doc.grid.size * (coarse ? COARSE_STEPS : 1);
    return { x: direction.x * size, y: direction.y * size };
  };

  /** Commit a held nudge: the key's release, a blur, or a pointer press. */
  const settle = (): void => {
    if (heldKey === '') return;
    if (dirty) emit(doc, true);
    reset();
  };

  const ORIGIN: Point = { x: 0, y: 0 };
  const add = (left: Point, right: Point): Point => ({ x: left.x + right.x, y: left.y + right.y });

  /**
   * Open a keyboard gesture on the focused part of `shape`, as a pointer press
   * on it would: a shape drag, a vertex drag, or a midpoint insert that carries
   * straight on into one. Returns the document the gesture moves from.
   */
  const openNudge = (shape: MapShape, key: string): VectorDocument<MapShape> => {
    const { kind, index } = parseKey(focusedKey);
    open(shape, ORIGIN);
    heldKey = key;
    gesture = 'vertex';
    activeVertex = index;
    if (kind === 'vertex') {
      dragOrigin = (shape.points ?? [])[index] ?? ORIGIN;
      return doc;
    }
    const midpoint = edgeMidpoints(shape).find((edge) => edge.index === index);
    if (kind !== 'midpoint' || midpoint === undefined) {
      gesture = 'shape';
      activeVertex = -1;
      dragOrigin = shape.position;
      return doc;
    }
    dragOrigin = midpoint.point;
    handleFocus = { id: shape.id, key: `vertex-${index}` };
    return insertVertex(doc, shape.id, index, add(shape.position, midpoint.point));
  };

  /** One arrow press on the target: open a gesture on the first, carry it on for each repeat. */
  const nudge = (key: string, by: Point): void => {
    if (target === undefined) return;
    if (target.locked) {
      announcement = lockedMessage;
      return;
    }
    if (heldKey === '' && gesture !== '') return; // A pointer is mid-drag; it has the shape.
    const base = heldKey === '' ? openNudge(target, key) : doc;
    const position = target.position;
    keyDelta = add(keyDelta, by);
    dirty = true;
    const moved = add(dragOrigin, keyDelta);
    if (gesture === 'shape') emit(dragShape(base, activeId, dragOrigin, ORIGIN, keyDelta), false);
    else emit(dragVertex(base, activeId, activeVertex, dragOrigin, ORIGIN, keyDelta), false);
    const at = gesture === 'shape' ? moved : add(position, moved);
    announcement = movedMessage(format(at.x), format(at.y));
  };

  /** `]` / `[`: the next or previous shape, or handle when inside one. */
  const cycle = (by: 1 | -1): void => {
    settle();
    if (focusedKey !== '' && target !== undefined) {
      const at = handleKeys.indexOf(focusedKey);
      const next = handleKeys[(at + by + handleKeys.length) % handleKeys.length] ?? '';
      handleFocus = { id: target.id, key: next };
      return;
    }
    const order = sortByZIndex(doc.elements);
    if (order.length === 0) return;
    const at = target === undefined ? (by === 1 ? -1 : order.length) : order.indexOf(target);
    const next = order[(at + by + order.length) % order.length];
    if (next !== undefined) onselect?.(new Set([next.id]));
  };

  /** Enter / Space with the select tool: into the handles, or a vertex at a midpoint. */
  const activate = (): boolean => {
    settle();
    if (target === undefined) return true;
    if (!reshapes(target)) {
      if (target.locked) announcement = lockedMessage;
      return true;
    }
    const { kind, index } = parseKey(focusedKey);
    if (focusedKey === '') handleFocus = { id: target.id, key: handleKeys[0] ?? '' };
    else if (kind === 'midpoint') addVertex(target, index);
    return true;
  };

  /** A vertex at the midpoint whose insertion index is `index`, focused once it is there. */
  const addVertex = (shape: MapShape, index: number): void => {
    const midpoint = edgeMidpoints(shape).find((edge) => edge.index === index);
    if (midpoint === undefined) return;
    // Counted before the edit: the page applies it synchronously, and `target`
    // is the edited shape by the time `emit` returns.
    const count = (shape.points ?? []).length + 1;
    open(shape, ORIGIN);
    emit(insertVertex(doc, shape.id, index, add(shape.position, midpoint.point)), true);
    reset();
    handleFocus = { id: shape.id, key: `vertex-${index}` };
    announcement = vertexAddedMessage(index + 1, count);
  };

  /** Delete / Backspace: the focused vertex, down to the kind's floor. */
  const remove = (): boolean => {
    settle();
    const { kind, index } = parseKey(focusedKey);
    if (target === undefined) return false;
    if (kind !== 'vertex') return true;
    const next = removeVertex(doc, target.id, index);
    if (next === doc) {
      announcement = vertexKeptMessage(MINIMUM_VERTICES[target.type]);
      return true;
    }
    // Counted before the edit, for `addVertex`'s reason.
    const count = (target.points ?? []).length - 1;
    const id = target.id;
    open(target, ORIGIN);
    emit(next, true);
    reset();
    handleFocus = { id, key: `vertex-${Math.max(0, index - 1)}` };
    announcement = vertexRemovedMessage(count);
    return true;
  };

  /** Escape: out of the handles, then out of the selection. */
  const back = (): boolean => {
    settle();
    if (focusedKey !== '') {
      handleFocus = { id: '', key: '' };
      return true;
    }
    if (selected.size === 0) return false;
    onselect?.(new Set<string>());
    return true;
  };

  /** Where the drawing cursor starts: the outline's last vertex, or the middle of the view. */
  const placeCursor = (): void => {
    if (cursorPlaced) return;
    const current = doc.elements.find((element) => element.id === drawing);
    const last = current === undefined ? [] : shapeVertices(current).slice(-1);
    const centre = screenToCanvas({ x: width / 2, y: height / 2 }, doc.viewport);
    cursor = last[0] ?? (doc.grid.snap ? snapToGrid(centre, doc.grid.size) : centre);
    cursorPlaced = true;
  };

  /** Escape with a drawing tool: finish the outline now, or let the key through. */
  const abandon = (): boolean => {
    if (drawing === '') return false;
    finishDrawing();
    return true;
  };

  /** Enter / Space with a drawing tool: a vertex at the cursor, or the finish. */
  const placeVertex = (): void => {
    const current = doc.elements.find((element) => element.id === drawing);
    const count = current === undefined ? 1 : (current.points ?? []).length + 1;
    draw(cursor, 1, true);
    // Back on the first vertex finishes instead, and `finishDrawing` said so.
    if (current === undefined || drawing !== '') announcement = vertexAddedMessage(count, count);
  };

  const PLACE_KEYS = new Set(['Enter', ' ']);

  /** A key with a drawing tool in hand; whether it was claimed. */
  const drawKey = (event: KeyboardEvent): boolean => {
    if (event.key === 'Escape') return abandon();
    const direction = ARROWS.get(event.key);
    const placing = PLACE_KEYS.has(event.key);
    if (direction === undefined && !placing) return false;
    if (newShape === undefined) {
      if (placing) announcement = drawingOffMessage;
      return placing;
    }
    placeCursor();
    if (direction === undefined) {
      placeVertex();
      return true;
    }
    cursor = add(cursor, step(direction, event.shiftKey));
    announcement = cursorLabel(format(cursor.x), format(cursor.y));
    return true;
  };

  const claim =
    (act: () => void) =>
    (): boolean => {
      act();
      return true;
    };

  /** The select tool's keys, other than the arrows; each says whether it claimed the key. */
  const SELECT_KEYS = new Map<string, () => boolean>([
    [']', claim(() => cycle(1))],
    ['[', claim(() => cycle(-1))],
    ['Enter', activate],
    [' ', activate],
    ['Delete', remove],
    ['Backspace', remove],
    ['Escape', back],
  ]);

  /** A key with the select tool in hand; whether it was claimed. */
  const selectKey = (event: KeyboardEvent): boolean => {
    const act = SELECT_KEYS.get(event.key);
    if (act !== undefined) return act();
    const direction = ARROWS.get(event.key);
    if (direction === undefined || target === undefined) return false;
    nudge(event.key, step(direction, event.shiftKey));
    return true;
  };

  /** Ctrl, Alt and Meta chords are the page's (its own Ctrl+Z among them). */
  const chorded = (event: KeyboardEvent): boolean => event.ctrlKey || event.metaKey || event.altKey;

  const toolKey = (event: KeyboardEvent): boolean => {
    if (drawingTool) return drawKey(event);
    return tool === 'select' && selectKey(event);
  };

  const key = (event: KeyboardEvent): void => {
    if (event.type === 'keyup') {
      if (ARROWS.has(event.key)) settle();
      return;
    }
    if (!chorded(event) && toolKey(event)) event.preventDefault();
  };

  const focusChange = (focused: boolean): void => {
    surfaceFocused = focused;
    if (!focused) settle();
    else if (drawingTool) placeCursor();
  };

  const interact = (event: {
    readonly phase: 'down' | 'move' | 'up';
    readonly point: Point;
    readonly detail: number;
    readonly native: PointerEvent;
  }): void => {
    if (event.phase === 'down') {
      settle();
      if (drawingTool) draw(event.point, event.detail, false);
      else pick(event.point, event.native);
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
  {activedescendant}
  describedby="{uid}-keys"
  {onviewportchange}
  oninteract={interact}
  onkey={key}
  onfocuschange={focusChange}
  class={className}
>
  {#snippet element(shape: MapShape, isSelected: boolean)}
    {@const focused = !drawingTool && shape.id === target?.id}
    <MapShapeView
      {shape}
      selected={isSelected}
      editable={tool === 'select' && !shape.locked}
      focus={focused ? targetFocus : ''}
      focusId={focused ? targetFocusId : ''}
      focusLabel={focused ? describe(shape, targetFocus) : ''}
      focusVisible={focused && surfaceFocused}
    />
  {/snippet}
  {#snippet overlay()}
    {#if cursorShown}
      <g
        id={cursorId}
        role="img"
        aria-label={cursorLabel(format(cursor.x), format(cursor.y))}
        transform="translate({cursor.x},{cursor.y})"
        pointer-events="none"
        stroke="var(--color-base-content)"
        stroke-width="1.5"
        fill="none"
      >
        <circle r="5" />
        <path d="M -9 0 H -5 M 5 0 H 9 M 0 -9 V -5 M 0 5 V 9" />
      </g>
    {/if}
  {/snippet}
</VectorCanvas>
<p id="{uid}-keys" class="sr-only">{keysDescription}</p>
<p class="sr-only" role="status" aria-live="polite">{announcement}</p>
