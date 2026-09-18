/**
 * Unit tests for the pure geometry `VectorCanvas` and every tool built on it
 * share: coordinate transforms, hit tests, paint order and the viewport.
 *
 * These are the parts worth testing without a browser — a click either lands
 * on a shape or it does not, and that is an assertion about arithmetic. The
 * component's own spec (`./VectorCanvas.test.ts`) drives a real pointer and
 * asserts only what the arithmetic cannot say.
 *
 * @module tests/canvas/geometry
 */

import { describe, expect, it } from 'vitest';
import type { CanvasElement } from '../../src/lib/canvas/types.ts';
import {
  boundingBox,
  canvasToScreen,
  distance,
  panBy,
  pointInRect,
  pointNearLine,
  rotatePoint,
  screenToCanvas,
  snapToGrid,
  sortByZIndex,
  zoomAbout,
} from '../../src/lib/canvas/utils.ts';

const viewport = { offsetX: 100, offsetY: 50, zoom: 2 };

const element = (id: string, x: number, y: number, zIndex: number): CanvasElement => ({
  id,
  type: 'node',
  position: { x, y },
  rotation: 0,
  zIndex,
  strokeColor: '',
  strokeWidth: 1,
  fillColor: '',
  opacity: 1,
  locked: false,
});

describe('canvas coordinates', () => {
  it('round-trips a point through screen space', () => {
    const point = { x: 12.5, y: -8 };
    expect(canvasToScreen(screenToCanvas(point, viewport), viewport)).toEqual(point);
  });

  it('divides by the zoom going in and multiplies going out', () => {
    expect(screenToCanvas({ x: 300, y: 150 }, viewport)).toEqual({ x: 100, y: 50 });
    expect(canvasToScreen({ x: 100, y: 50 }, viewport)).toEqual({ x: 300, y: 150 });
  });

  it('snaps to the nearest intersection, in both directions', () => {
    expect(snapToGrid({ x: 27, y: 33 }, 20)).toEqual({ x: 20, y: 40 });
    expect(snapToGrid({ x: -27, y: -33 }, 20)).toEqual({ x: -20, y: -40 });
  });

  it('measures distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('rotates about a centre', () => {
    const rotated = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, 90);
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBeCloseTo(10);
  });
});

describe('hit tests', () => {
  const rect = { x: 0, y: 0, width: 10, height: 10 };

  it('includes the edges', () => {
    expect(pointInRect({ x: 0, y: 0 }, rect)).toBe(true);
    expect(pointInRect({ x: 10, y: 10 }, rect)).toBe(true);
    expect(pointInRect({ x: 10.1, y: 5 }, rect)).toBe(false);
  });

  it('clamps a line hit test to the SEGMENT, not the infinite line', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 10, y: 0 };
    expect(pointNearLine({ x: 5, y: 2 }, start, end, 5)).toBe(true);
    // On the infinite line, but far past the end of the segment.
    expect(pointNearLine({ x: 100, y: 0 }, start, end, 5)).toBe(false);
  });

  it('treats a zero-length segment as a point', () => {
    const at = { x: 4, y: 4 };
    expect(pointNearLine({ x: 6, y: 4 }, at, at, 5)).toBe(true);
    expect(pointNearLine({ x: 40, y: 4 }, at, at, 5)).toBe(false);
  });
});

describe('element ordering and extent', () => {
  it('sorts by paint order without mutating the input', () => {
    const input = [element('a', 0, 0, 3), element('b', 0, 0, 1)];
    expect(sortByZIndex(input).map((node) => node.id)).toEqual(['b', 'a']);
    expect(input.map((node) => node.id)).toEqual(['a', 'b']);
  });

  it('has no bounding box for no elements', () => {
    expect(boundingBox([])).toEqual([]);
  });

  it('encloses every origin', () => {
    expect(boundingBox([element('a', 10, 20, 0), element('b', 40, 5, 0)])).toEqual([
      { x: 10, y: 5, width: 30, height: 15 },
    ]);
  });
});

describe('viewport', () => {
  it('pans one-for-one in screen pixels, whatever the zoom', () => {
    // NOT divided by the zoom: a drag has to stay attached to the thing being
    // dragged, and dividing would make it lag behind the cursor at zoom > 1.
    expect(panBy(viewport, 10, -4)).toEqual({ offsetX: 110, offsetY: 46, zoom: 2 });
  });

  it('keeps the point under the cursor fixed while zooming', () => {
    const pointer = { x: 300, y: 150 };
    const before = screenToCanvas(pointer, viewport);
    const zoomed = zoomAbout(viewport, pointer, 1.1);
    const after = screenToCanvas(pointer, zoomed);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(zoomed.zoom).toBeCloseTo(2.2);
  });

  it('clamps the zoom at both ends', () => {
    const pointer = { x: 0, y: 0 };
    expect(zoomAbout({ ...viewport, zoom: 9.5 }, pointer, 4).zoom).toBe(10);
    expect(zoomAbout({ ...viewport, zoom: 0.15 }, pointer, 0.1).zoom).toBe(0.1);
  });
});
