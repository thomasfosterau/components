/**
 * `@thomasfosterau/components/canvas` — a low-level toolkit for vector-editing
 * surfaces: pan, zoom, a grid, and pointer gestures reported in canvas
 * coordinates. The application defines its element types, its tools and its
 * renderer.
 *
 * A separate entry point so it never sits on the always-loaded path of a
 * consumer that does not use it.
 *
 * @module
 */

export { default as VectorCanvas } from './VectorCanvas.svelte';
export {
  applyTransform,
  diffTransform,
  emptyHistory,
  HISTORY_LIMIT,
  invertTransform,
  recordEdit,
  redo,
  undo,
  type History,
  type HistoryStep,
} from './history.ts';
export type {
  CanvasElement,
  ElementId,
  GridConfig,
  HistoryEntry,
  Point,
  Rect,
  Transform,
  VectorDocument,
  Viewport,
} from './types.ts';
export {
  boundingBox,
  canvasToScreen,
  distance,
  generateId,
  panBy,
  pointInRect,
  pointNearLine,
  rotatePoint,
  screenToCanvas,
  snapToGrid,
  sortByZIndex,
  zoomAbout,
} from './utils.ts';
