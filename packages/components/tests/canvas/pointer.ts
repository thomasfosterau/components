/**
 * Driving a pointer surface with REAL browser input.
 *
 * `VectorCanvas` and `MapEditor` are geometry: what they do depends on where
 * the pointer was, to the canvas unit. Vitest's `userEvent` routes through the
 * Playwright provider, whose `click` / `dblClick` / `dropTo` take exactly the
 * element-relative positions this needs — so these are Chromium's own trusted
 * pointer events at a chosen point, not `dispatchEvent` with a made-up
 * `clientX`. A synthetic event would pass whatever the implementation happened
 * to read; this fails if the surface mis-measures itself.
 *
 * Vitest declares `UserEventClickOptions` and friends EMPTY on purpose: they
 * are the seam a browser provider fills in, and no provider package ships the
 * augmentation. The block below is that augmentation, narrowed to the four
 * options used here — `@vitest/browser-playwright` forwards them verbatim to
 * `locator.click` / `locator.dblclick` / `frame.dragAndDrop`.
 *
 * @module tests/canvas/pointer
 */

import type { Locator } from 'vite-plus/test/browser';

/** A point in the surface's own CSS pixels, measured from its top-left corner. */
export interface At {
  readonly x: number;
  readonly y: number;
}

declare module '@vitest/browser/context' {
  interface UserEventClickOptions {
    position?: At;
    modifiers?: readonly ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[];
  }
  interface UserEventDoubleClickOptions {
    position?: At;
  }
  interface UserEventDragAndDropOptions {
    sourcePosition?: At;
    targetPosition?: At;
  }
}

/**
 * A fresh, mutable copy of a point.
 *
 * Load-bearing, and the reason no helper here passes a caller's object
 * through: the Playwright locator scales `position` into page pixels BY
 * MUTATING the object it is handed, so a point a spec declared once as a
 * constant and used twice is a different point the second time. It fails
 * quietly — the first use is correct and every later one is off by the
 * iframe's scale, which is a few units, which is a click that lands on the
 * wrong shape rather than an error.
 */
const copy = (at: At): { x: number; y: number } => ({ x: at.x, y: at.y });

/** One press and release at a point on the surface. */
export const press = (surface: Locator, at: At): Promise<void> =>
  surface.click({ position: copy(at) });

/**
 * A press and release with Alt held — the modifier `MapEditor` reads as
 * "remove this vertex".
 */
// Unused by this package's suites, kept so this file stays identical to
// packages/mapbox/tests/pointer.ts, whose MapEditor suite uses it.
// fallow-ignore-next-line unused-export
export const altPress = (surface: Locator, at: At): Promise<void> =>
  surface.click({ position: copy(at), modifiers: ['Alt'] });

/** Two presses in quick succession, so the second carries `detail > 1`. */
// Kept for parity with packages/mapbox/tests/pointer.ts (see `altPress`).
// fallow-ignore-next-line unused-export
export const doublePress = (surface: Locator, at: At): Promise<void> =>
  surface.dblClick({ position: copy(at) });

/**
 * Press at `from`, move, release at `to` — all on the one surface.
 *
 * Playwright emits more than one intermediate move, which is exactly the
 * traffic a real drag produces and the reason `MapEditor` anchors each drag to
 * where it STARTED: a spec that only worked for a single move would not be
 * testing the thing that stops a shape drifting.
 */
export const drag = (surface: Locator, from: At, to: At): Promise<void> =>
  surface.dropTo(surface, { sourcePosition: copy(from), targetPosition: copy(to) });
