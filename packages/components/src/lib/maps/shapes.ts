/**
 * The three shapes a plan is made of, and the geometry `MapEditor` needs to
 * draw, hit-test and EDIT them.
 *
 * The vocabulary is a plan's, and the worked examples below are a garden's
 * because that is where it was hardened: a `polygon` is an AREA (a bed, a
 * room, a zone), a `line` is a PATH (a hedge, a corridor, a fence) and a
 * `marker` is a POINT (a planting, a fitting). Nothing here depends on which
 * of those an application means.
 *
 * Pure functions over plain data, outside the component, for the same reason
 * `canvas/utils.ts` is: a unit test can pin "does this click land on this bed"
 * — or on this bed's third corner — without mounting an SVG.
 *
 * Every function here takes and returns CANVAS coordinates, even where the
 * data it writes is shape-local. One convention at the seam means the caller
 * (a pointer gesture) never converts, and the conversion is in one place
 * rather than at every call site.
 *
 * @module @thomasfosterau/components/maps/shapes
 */

import type { CanvasElement, Point, Rect, Transform, VectorDocument } from '../canvas/types.ts';
import { distance, pointInRect, pointNearLine, sortByZIndex } from '../canvas/utils.ts';

/**
 * A bed (`polygon`, a closed outline), a path or hedge (`line`, an open one)
 * or a planting (`marker`, a disc). All three sit at `position` in canvas
 * coordinates; a polygon's and a line's `points` are relative to that, so
 * moving the shape does not rewrite its outline.
 *
 * `line` is what separates the two outline kinds: the vertices are handled
 * identically and only {@link shapePath} differs, by closing one and not the
 * other.
 */
export interface MapShape extends CanvasElement {
  readonly type: 'polygon' | 'line' | 'marker';
  /** A polygon's or line's vertices, relative to `position`, in order. */
  readonly points?: readonly Point[];
  /** A marker's radius in canvas units. */
  readonly radius?: number;
}

/**
 * What `MapEditor` reports alongside each new document: the change as data, and
 * whether the gesture that produced it is over.
 *
 * `committed` is the whole coalescing story. A drag reports a document on every
 * pointer move with `committed: false` and once more on release with
 * `committed: true`, and the committed transform spans the entire gesture — so
 * a page records history on `committed` alone and gets one undo entry per drag
 * without tracking pointer state itself.
 */
export interface MapEdit {
  readonly transform: Transform<MapShape>;
  readonly committed: boolean;
}

/** How few vertices each kind can be reduced to before it stops being one. */
const MINIMUM_VERTICES = { polygon: 3, line: 2, marker: 0 } as const;

/** How near a pointer must come to a handle, in canvas units, to take it. */
export const HANDLE_TOLERANCE = 6;

/** How near a pointer must come to a line to select it, in canvas units. */
const LINE_TOLERANCE = 5;

/**
 * The `d` of one outline: closed for a polygon, open for a line, empty for a
 * marker or an outline too short to draw.
 */
export const shapePath = (shape: MapShape): string => {
  const points = shape.points ?? [];
  if (shape.type === 'marker' || points.length < 2) return '';
  const drawn = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');
  return shape.type === 'polygon' ? `${drawn} Z` : drawn;
};

/**
 * The shape's vertices in CANVAS coordinates — its `points` offset by its
 * `position`.
 *
 * The rotation is deliberately ignored, and this is now the ONE place that
 * ignores it: {@link shapeBounds}, {@link vertexAt} and {@link edgeMidpoints}
 * all read the world through here, so rotation lands by changing this function
 * rather than by finding every caller. A box or a handle that accounted for
 * rotation today would be untested code pretending to work.
 */
export const shapeVertices = (shape: MapShape): readonly Point[] =>
  (shape.points ?? []).map((point) => ({
    x: shape.position.x + point.x,
    y: shape.position.y + point.y,
  }));

/** The shape's box in CANVAS coordinates — what a click is tested against. */
export const shapeBounds = (shape: MapShape): Rect => {
  const vertices = shapeVertices(shape);
  if (shape.type === 'marker' || vertices.length === 0) {
    const radius = shape.radius ?? 6;
    return {
      x: shape.position.x - radius,
      y: shape.position.y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }
  const xs = vertices.map((point) => point.x);
  const ys = vertices.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
};

/**
 * Whether a point picks this shape.
 *
 * A `line` is tested against its SEGMENTS rather than its box, because a line
 * has no interior for a box to approximate — the box of a diagonal path is
 * mostly the ground either side of it, and clicking there would pick the path.
 * A polygon keeps the box test; tightening that to a point-in-polygon test is
 * a real improvement for a concave bed and a separate one from this.
 */
const shapeHit = (shape: MapShape, point: Point): boolean => {
  if (shape.type !== 'line') return pointInRect(point, shapeBounds(shape));
  const vertices = shapeVertices(shape);
  return vertices.some((start, index) => {
    // Read rather than indexed twice: under `noUncheckedIndexedAccess` the
    // bound check and the access are two facts the compiler does not connect,
    // and the last vertex genuinely begins no segment.
    const end = vertices[index + 1];
    return end !== undefined && pointNearLine(point, start, end, LINE_TOLERANCE);
  });
};

/**
 * The id of the topmost shape under a point, or `""` for none.
 *
 * Searched in reverse paint order because `VectorCanvas` draws by ascending
 * `zIndex`: the LAST shape drawn is the one the reader sees on top, and the one
 * a click should get.
 */
export const shapeAt = (shapes: readonly MapShape[], point: Point): string => {
  const found = sortByZIndex(shapes).findLast((shape) => shapeHit(shape, point));
  return found === undefined ? '' : found.id;
};

/**
 * The index of the vertex under a point, or `-1` for none.
 *
 * `-1` rather than a nullable index, matching {@link shapeAt}'s `""` and
 * `VectorCanvas`'s own "no pointer down" sentinel: a caller that forgets the
 * check gets an index that reads as out of range everywhere downstream rather
 * than a `null` that type-checks into arithmetic.
 *
 * The LAST match wins, so the vertex drawn on top is the one taken — the same
 * rule `shapeAt` applies to shapes, and it matters where a bed has doubled
 * back on itself.
 */
export const vertexAt = (shape: MapShape, point: Point, tolerance = HANDLE_TOLERANCE): number =>
  shapeVertices(shape).findLastIndex((vertex) => distance(vertex, point) <= tolerance);

/**
 * The midpoint of every edge, in SHAPE-LOCAL coordinates, each paired with the
 * index a vertex inserted there would take.
 *
 * A polygon's closing edge (last vertex back to first) is included and its
 * index is one past the end, so the whole outline is reachable; a line has no
 * closing edge and so one fewer midpoint. Below two vertices there are no
 * edges and the result is empty rather than a midpoint of one point with
 * itself.
 */
export const edgeMidpoints = (
  shape: MapShape,
): readonly { readonly index: number; readonly point: Point }[] => {
  const points = shape.points ?? [];
  if (shape.type === 'marker' || points.length < 2) return [];
  const edges = shape.type === 'polygon' ? points.length : points.length - 1;
  return Array.from({ length: edges }, (_unused, index) => index).flatMap((index) => {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    // Both are present — `index < edges <= points.length` — but that is
    // arithmetic the compiler does not do under `noUncheckedIndexedAccess`.
    // Dropping the edge rather than asserting keeps the impossible case honest.
    if (start === undefined || end === undefined) return [];
    return [{ index: index + 1, point: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } }];
  });
};

/**
 * The insertion index of the edge midpoint under a point, or `-1` for none.
 *
 * Takes canvas coordinates and returns an index into `points`, which is the
 * pair {@link insertVertex} expects — the caller never converts.
 */
export const midpointAt = (shape: MapShape, point: Point, tolerance = HANDLE_TOLERANCE): number => {
  const found = edgeMidpoints(shape).find(
    (midpoint) =>
      distance(
        { x: shape.position.x + midpoint.point.x, y: shape.position.y + midpoint.point.y },
        point,
      ) <= tolerance,
  );
  return found === undefined ? -1 : found.index;
};

/** The document with `id`'s vertices replaced, unless the shape is locked. */
const withPoints = (
  doc: VectorDocument<MapShape>,
  id: string,
  rewrite: (points: readonly Point[]) => readonly Point[],
): VectorDocument<MapShape> => ({
  ...doc,
  elements: doc.elements.map((shape) =>
    shape.id === id && !shape.locked && shape.type !== 'marker'
      ? { ...shape, points: rewrite(shape.points ?? []) }
      : shape,
  ),
});

/**
 * The document with one shape moved to `origin` plus the drag's delta.
 *
 * Anchored to where the shape was when the drag STARTED rather than
 * accumulating per-move deltas: accumulating drifts whenever a pointer move is
 * coalesced or dropped, and the drift is invisible until a bed has walked off
 * its plan. A locked shape is returned untouched — the lock is enforced here so
 * every caller gets it, not only the ones that remember.
 */
export const dragShape = (
  doc: VectorDocument<MapShape>,
  id: string,
  origin: Point,
  from: Point,
  to: Point,
): VectorDocument<MapShape> => ({
  ...doc,
  elements: doc.elements.map((shape) =>
    shape.id === id && !shape.locked
      ? { ...shape, position: { x: origin.x + (to.x - from.x), y: origin.y + (to.y - from.y) } }
      : shape,
  ),
});

/**
 * The document with one vertex moved to `origin` plus the drag's delta.
 *
 * `origin` is the vertex's own (shape-local) coordinates when the drag began,
 * and the delta is in canvas units — the same thing, since dragging a vertex
 * does not move the shape it belongs to. Anchored to the start of the drag for
 * {@link dragShape}'s reason, which is if anything sharper here: a vertex that
 * drifts a unit per coalesced move turns a rectangle into a trapezium.
 *
 * An index outside the outline leaves the document alone, so a caller holding
 * a stale index from before a removal cannot write a vertex onto a different
 * corner.
 */
export const dragVertex = (
  doc: VectorDocument<MapShape>,
  id: string,
  index: number,
  origin: Point,
  from: Point,
  to: Point,
): VectorDocument<MapShape> =>
  withPoints(doc, id, (points) =>
    index < 0 || index >= points.length
      ? points
      : points.with(index, { x: origin.x + (to.x - from.x), y: origin.y + (to.y - from.y) }),
  );

/**
 * The document with a vertex inserted at `index`, taking its coordinates from
 * a CANVAS point.
 *
 * `index` is the position the new vertex takes, so the index an edge's
 * midpoint reports ({@link edgeMidpoints}) splits that edge. An index past the
 * end appends, which is what makes the same function serve both inserting into
 * a bed and drawing a new one.
 */
export const insertVertex = (
  doc: VectorDocument<MapShape>,
  id: string,
  index: number,
  at: Point,
): VectorDocument<MapShape> => {
  const shape = doc.elements.find((element) => element.id === id);
  if (shape === undefined) return doc;
  const local = { x: at.x - shape.position.x, y: at.y - shape.position.y };
  return withPoints(doc, id, (points) => points.toSpliced(Math.max(0, index), 0, local));
};

/**
 * The document with one vertex removed — unless removing it would leave
 * something that is no longer a polygon (below three) or a line (below two).
 *
 * The floor is enforced here rather than in the editor so a toolbar button, a
 * Delete key and a modifier-click all get it. A two-vertex "polygon" is not a
 * degraded bed, it is a bed the reader can no longer see or fix.
 */
export const removeVertex = (
  doc: VectorDocument<MapShape>,
  id: string,
  index: number,
): VectorDocument<MapShape> => {
  const shape = doc.elements.find((element) => element.id === id);
  if (shape === undefined) return doc;
  const points = shape.points ?? [];
  if (index < 0 || index >= points.length) return doc;
  if (points.length <= MINIMUM_VERTICES[shape.type]) return doc;
  return withPoints(doc, id, (current) => current.toSpliced(index, 1));
};

/** Whether the outline has enough vertices to be the kind it claims to be. */
export const isDrawable = (shape: MapShape): boolean =>
  (shape.points ?? []).length >= MINIMUM_VERTICES[shape.type];

/**
 * A new shape at `at` with one vertex and no styling of its own.
 *
 * `MapEditor` will not create a shape itself — the page owning the document is
 * the only place that knows what a new bed should look like, which is why
 * drawing is reached through a callback. This is what that callback returns
 * when the page has no house style yet, so a story or a test can turn drawing
 * on in one line instead of restating eleven inherited fields.
 */
export const blankShape = (type: MapShape['type'], id: string, at: Point): MapShape => {
  const base = {
    id,
    type,
    position: at,
    rotation: 0,
    zIndex: 0,
    strokeColor: 'currentColor',
    strokeWidth: 1,
    fillColor: 'none',
    opacity: 1,
    locked: false,
  };
  // A marker simply HAS no `points` under `exactOptionalPropertyTypes`, which
  // is not the same as having `undefined` ones.
  return type === 'marker' ? base : { ...base, points: [{ x: 0, y: 0 }] };
};
