/**
 * VectorCanvas geometry — coordinate transforms and hit tests, as pure
 * functions over the types in `./types.ts`.
 *
 * Pure and free of the component on purpose: these are what a unit test can
 * pin without mounting anything, and what an application's own tools (a
 * marquee select, a snap-to-neighbour) reuse rather than re-derive.
 *
 * @module @thomasfosterau/components/canvas/utils
 */

import type { CanvasElement, ElementId, Point, Rect, Viewport } from './types.ts';

/**
 * A fresh element id.
 *
 * `crypto.randomUUID` is present in every browser this library supports and in
 * workerd; a `Date.now()` + `Math.random()` fallback for environments that are
 * no longer targets would be worse than none — a duplicate id silently merges
 * two elements.
 */
export const generateId = (): ElementId => crypto.randomUUID();

/** Screen (viewport-relative) coordinates → canvas coordinates. */
export const screenToCanvas = (point: Point, viewport: Viewport): Point => ({
  x: (point.x - viewport.offsetX) / viewport.zoom,
  y: (point.y - viewport.offsetY) / viewport.zoom,
});

/** Canvas coordinates → screen (viewport-relative) coordinates. */
export const canvasToScreen = (point: Point, viewport: Viewport): Point => ({
  x: point.x * viewport.zoom + viewport.offsetX,
  y: point.y * viewport.zoom + viewport.offsetY,
});

/** The nearest grid intersection. */
export const snapToGrid = (point: Point, gridSize: number): Point => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize,
});

/** Euclidean distance between two points. */
export const distance = (from: Point, to: Point): number =>
  Math.hypot(to.x - from.x, to.y - from.y);

/** Whether a point falls inside a box (edges included). */
export const pointInRect = (point: Point, rect: Rect): boolean =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

/**
 * Whether a point is within `threshold` of a line SEGMENT — the projection is
 * clamped to the segment, so a point far past an endpoint is not "near the
 * line" the way it would be for an infinite one.
 */
export const pointNearLine = (point: Point, start: Point, end: Point, threshold = 5): boolean => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(point, start) <= threshold;
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );
  return distance(point, { x: start.x + t * dx, y: start.y + t * dy }) <= threshold;
};

/** Paint order: lowest `zIndex` first. Returns a new array. */
export const sortByZIndex = <T extends CanvasElement>(elements: readonly T[]): readonly T[] =>
  elements.toSorted((left, right) => left.zIndex - right.zIndex);

/**
 * The box enclosing every element's ORIGIN — not its drawn extent, which only
 * the application's renderer knows. Enough for "centre the view on the
 * selection"; not enough for "fit the selection exactly".
 *
 * Empty input has no box, which is why the result is an array of none or one
 * rather than a nullable `Rect`.
 */
export const boundingBox = (elements: readonly CanvasElement[]): readonly Rect[] => {
  if (elements.length === 0) return [];
  const xs = elements.map((element) => element.position.x);
  const ys = elements.map((element) => element.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return [{ x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }];
};

/** A point rotated `degrees` clockwise about `centre`. */
export const rotatePoint = (point: Point, centre: Point, degrees: number): Point => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  return { x: centre.x + dx * cos - dy * sin, y: centre.y + dx * sin + dy * cos };
};

/**
 * The viewport after a pan of `dx`/`dy` SCREEN pixels.
 *
 * Screen pixels, not canvas units, and so not divided by the zoom: panning
 * moves the document one-for-one under the cursor, which is what makes a drag
 * feel attached to the thing being dragged at every zoom level.
 */
export const panBy = (viewport: Viewport, dx: number, dy: number): Viewport => ({
  ...viewport,
  offsetX: viewport.offsetX + dx,
  offsetY: viewport.offsetY + dy,
});

/** The zoom bounds; below the first the grid is useless, above the second the marks are. */
const ZOOM_RANGE = { min: 0.1, max: 10 } as const;

/**
 * The viewport after zooming by `factor` about a screen point.
 *
 * About the POINTER, not the origin: the point under the cursor is the one the
 * reader is looking at, and it stays where it is. Zooming about the origin
 * instead sends whatever they were examining off the edge, which is the single
 * most disorienting thing a canvas can do.
 */
export const zoomAbout = (viewport: Viewport, pointer: Point, factor: number): Viewport => {
  const zoom = Math.max(ZOOM_RANGE.min, Math.min(ZOOM_RANGE.max, viewport.zoom * factor));
  const anchor = screenToCanvas(pointer, viewport);
  return {
    zoom,
    offsetX: pointer.x - anchor.x * zoom,
    offsetY: pointer.y - anchor.y * zoom,
  };
};
