/**
 * The zoom and pan maths behind `Lightbox`: a scale and an offset of the
 * image's centre from the stage's centre, in CSS pixels. Pure, so the
 * component's pointer and key handlers stay a dispatch.
 *
 * @module
 */

/** A zoom state: `scale` (1 = fitted) and the offset of the image's centre from the stage's. */
export interface ZoomState {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

/** A width and height in CSS pixels. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/** A point relative to the stage's centre. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The fitted, unpanned state. */
export const unzoomed: ZoomState = { scale: 1, x: 0, y: 0 };

/** Whether the image is zoomed in past fitted. */
export const isZoomed = (state: ZoomState): boolean => state.scale > 1.001;

/** `value` within ±`limit`; `+ 0` turns a `-0` into `0`. */
const within = (value: number, limit: number): number =>
  Math.min(limit, Math.max(-limit, value)) + 0;

/**
 * Keep the image covering the stage along any axis where it is larger, and
 * centred along any axis where it is smaller. `image` is the fitted size.
 */
export function clampPan(state: ZoomState, image: Size, stage: Size): ZoomState {
  const limitX = Math.max(0, (image.width * state.scale - stage.width) / 2);
  const limitY = Math.max(0, (image.height * state.scale - stage.height) / 2);
  return {
    scale: state.scale,
    x: within(state.x, limitX),
    y: within(state.y, limitY),
  };
}

/**
 * Zoom to `scale` (clamped to 1–`maxZoom`) keeping the image point under
 * `focal` where it is, then clamp the pan. At scale 1 the offset is zero.
 */
export function zoomAbout(
  state: ZoomState,
  scale: number,
  focal: Point,
  maxZoom: number,
  image: Size,
  stage: Size,
): ZoomState {
  const next = Math.min(maxZoom, Math.max(1, scale));
  if (next === 1) return unzoomed;
  const ratio = next / state.scale;
  return clampPan(
    {
      scale: next,
      x: focal.x - (focal.x - state.x) * ratio,
      y: focal.y - (focal.y - state.y) * ratio,
    },
    image,
    stage,
  );
}

/** Move by `dx`, `dy`, clamped. */
export function panBy(
  state: ZoomState,
  dx: number,
  dy: number,
  image: Size,
  stage: Size,
): ZoomState {
  return clampPan({ scale: state.scale, x: state.x + dx, y: state.y + dy }, image, stage);
}

/** Double-click or double-tap: back to fitted when zoomed, otherwise 2× about `focal`. */
export function toggleZoom(
  state: ZoomState,
  focal: Point,
  maxZoom: number,
  image: Size,
  stage: Size,
): ZoomState {
  return isZoomed(state) ? unzoomed : zoomAbout(state, 2, focal, maxZoom, image, stage);
}

/** Distance and midpoint of two pointers. */
export function pinchGeometry(
  a: Point,
  b: Point,
): { readonly distance: number; readonly mid: Point } {
  return {
    distance: Math.hypot(b.x - a.x, b.y - a.y),
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  };
}

/**
 * A pinch in progress: from the state at its start, scale by the ratio of
 * the pointers' distances about the starting midpoint, then follow the
 * midpoint's movement (a two-finger pan).
 */
export function pinch(
  start: ZoomState,
  from: { readonly distance: number; readonly mid: Point },
  to: { readonly distance: number; readonly mid: Point },
  maxZoom: number,
  image: Size,
  stage: Size,
): ZoomState {
  if (from.distance === 0) return start;
  const zoomed = zoomAbout(
    start,
    start.scale * (to.distance / from.distance),
    from.mid,
    maxZoom,
    image,
    stage,
  );
  if (zoomed.scale === 1) return zoomed;
  return panBy(zoomed, to.mid.x - from.mid.x, to.mid.y - from.mid.y, image, stage);
}

/** What a one-finger swipe at fitted scale means, or `undefined` for too short a move. */
export function swipeIntent(
  dx: number,
  dy: number,
  threshold = 50,
): 'previous' | 'next' | 'close' | undefined {
  if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'next' : 'previous';
  if (dy >= threshold * 1.5 && dy > Math.abs(dx)) return 'close';
  return undefined;
}
