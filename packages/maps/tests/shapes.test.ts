/**
 * Unit tests for the geometry `MapEditor` is built on: what a click picks, what
 * a drag moves, and what an outline may be reduced to.
 *
 * Pure functions over plain data, so these assertions cost no browser — and
 * they are the ones the component's own spec cannot make, because a component
 * spec can only see the result of a gesture, not the rule that produced it.
 *
 * @module tests/shapes
 */

import { describe, expect, it } from 'vite-plus/test';
import type { VectorDocument } from '@thomasfosterau/components/canvas';
import {
  blankShape,
  dragShape,
  dragVertex,
  edgeMidpoints,
  insertVertex,
  isDrawable,
  midpointAt,
  removeVertex,
  shapeAt,
  shapeBounds,
  shapePath,
  shapeVertices,
  vertexAt,
  type MapShape,
} from '../src/lib/shapes.ts';

describe('map shapes', () => {
  const area: MapShape = {
    id: 'area',
    type: 'polygon',
    position: { x: 100, y: 100 },
    rotation: 0,
    zIndex: 0,
    strokeColor: '',
    strokeWidth: 1,
    fillColor: '',
    opacity: 1,
    locked: false,
    points: [
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 60, y: 40 },
      { x: 0, y: 40 },
    ],
  };

  it("closes a polygon's path", () => {
    expect(shapePath(area)).toBe('M0 0 L60 0 L60 40 L0 40 Z');
  });

  it('has no path for a shape with too few vertices', () => {
    expect(shapePath({ ...area, points: [{ x: 0, y: 0 }] })).toBe('');
  });

  it("offsets a polygon's bounds by its position", () => {
    expect(shapeBounds(area)).toEqual({ x: 100, y: 100, width: 60, height: 40 });
  });

  it("leaves a line's path open and closes a polygon's", () => {
    expect(shapePath({ ...area, type: 'line' })).toBe('M0 0 L60 0 L60 40 L0 40');
    expect(shapePath(area).endsWith(' Z')).toBe(true);
  });

  it("offsets a shape's vertices by its position", () => {
    expect(shapeVertices(area)[1]).toEqual({ x: 160, y: 100 });
  });

  it('knows which outlines are long enough to be what they claim', () => {
    const pair = (area.points ?? []).slice(0, 2);
    expect(isDrawable(area)).toBe(true);
    expect(isDrawable({ ...area, points: pair })).toBe(false);
    expect(isDrawable({ ...area, type: 'line', points: pair })).toBe(true);
  });

  it('boxes a marker around its centre', () => {
    // Built rather than spread from `area`: under `exactOptionalPropertyTypes` a
    // marker simply HAS no `points`, which is not the same as having
    // `undefined` ones.
    const { points: _outline, ...rest } = area;
    const marker: MapShape = { ...rest, type: 'marker', radius: 8 };
    expect(shapeBounds(marker)).toEqual({ x: 92, y: 92, width: 16, height: 16 });
  });
});

describe('editing a plan', () => {
  const area: MapShape = {
    id: 'area',
    type: 'polygon',
    position: { x: 0, y: 0 },
    rotation: 0,
    zIndex: 0,
    strokeColor: '',
    strokeWidth: 1,
    fillColor: '',
    opacity: 1,
    locked: false,
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ],
  };
  const overlay: MapShape = { ...area, id: 'overlay', zIndex: 5 };
  const doc: VectorDocument<MapShape> = {
    version: '1',
    metadata: {},
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    grid: { visible: true, size: 10, snap: true, color: '' },
    elements: [area, overlay],
  };

  it('picks the topmost shape under the point, not the first declared', () => {
    expect(shapeAt(doc.elements, { x: 10, y: 10 })).toBe('overlay');
  });

  it('picks nothing where there is nothing', () => {
    expect(shapeAt(doc.elements, { x: 900, y: 900 })).toBe('');
  });

  it('anchors a drag to where the shape started, not to the last move', () => {
    const moved = dragShape(doc, 'area', { x: 0, y: 0 }, { x: 5, y: 5 }, { x: 35, y: 25 });
    expect(moved.elements[0]?.position).toEqual({ x: 30, y: 20 });
    // A second move from the SAME origin replaces rather than accumulates.
    const again = dragShape(moved, 'area', { x: 0, y: 0 }, { x: 5, y: 5 }, { x: 15, y: 15 });
    expect(again.elements[0]?.position).toEqual({ x: 10, y: 10 });
  });

  it('refuses to move a locked shape', () => {
    const locked = { ...doc, elements: [{ ...area, locked: true }] };
    const moved = dragShape(locked, 'area', { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 50, y: 50 });
    expect(moved.elements[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it('leaves every other shape alone', () => {
    const moved = dragShape(doc, 'area', { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 });
    expect(moved.elements[1]).toBe(overlay);
  });

  it('picks a line by its segments, not by the empty half of its box', () => {
    const path: MapShape = {
      ...area,
      id: 'path',
      type: 'line',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    };
    // On the diagonal, and well inside the box but nowhere near the line.
    expect(shapeAt([path], { x: 50, y: 50 })).toBe('path');
    expect(shapeAt([path], { x: 90, y: 10 })).toBe('');
  });
});

describe('editing an outline', () => {
  const blank = blankShape('polygon', 'area', { x: 10, y: 10 });
  const square: MapShape = {
    ...blank,
    points: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ],
  };
  const doc: VectorDocument<MapShape> = {
    version: '1',
    metadata: {},
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    grid: { visible: false, size: 10, snap: false, color: '' },
    elements: [square],
  };

  it("finds a vertex through the shape's position, and nothing between two", () => {
    expect(vertexAt(square, { x: 50, y: 10 })).toBe(1);
    expect(vertexAt(square, { x: 30, y: 10 })).toBe(-1);
  });

  it('takes the topmost vertex when two coincide', () => {
    const doubled: MapShape = { ...square, points: [...(square.points ?? []), { x: 0, y: 0 }] };
    expect(vertexAt(doubled, { x: 10, y: 10 })).toBe(4);
  });

  it('anchors a vertex drag to where the vertex started, not to the last move', () => {
    const moved = dragVertex(doc, 'area', 1, { x: 40, y: 0 }, { x: 50, y: 10 }, { x: 70, y: 40 });
    expect(moved.elements[0]?.points?.[1]).toEqual({ x: 60, y: 30 });
    // A second move from the SAME origin replaces rather than accumulates.
    const again = dragVertex(moved, 'area', 1, { x: 40, y: 0 }, { x: 50, y: 10 }, { x: 55, y: 15 });
    expect(again.elements[0]?.points?.[1]).toEqual({ x: 45, y: 5 });
  });

  it('refuses to reshape a locked shape, or to write past the end of the outline', () => {
    const locked = { ...doc, elements: [{ ...square, locked: true }] };
    expect(dragVertex(locked, 'area', 0, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 99, y: 99 })).toEqual(
      locked,
    );
    const stale = dragVertex(doc, 'area', 9, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 99, y: 99 });
    expect(stale.elements[0]?.points).toEqual(square.points);
  });

  it("puts a midpoint on every edge, the closing one included, and none on a line's", () => {
    expect(edgeMidpoints(square)).toEqual([
      { index: 1, point: { x: 20, y: 0 } },
      { index: 2, point: { x: 40, y: 20 } },
      { index: 3, point: { x: 20, y: 40 } },
      { index: 4, point: { x: 0, y: 20 } },
    ]);
    expect(edgeMidpoints({ ...square, type: 'line' })).toHaveLength(3);
    expect(edgeMidpoints({ ...square, points: [{ x: 0, y: 0 }] })).toEqual([]);
  });

  it("reports a midpoint's insertion index from a canvas point", () => {
    expect(midpointAt(square, { x: 30, y: 10 })).toBe(1);
    // Five units out is still inside the six-unit tolerance; eight is not.
    expect(midpointAt(square, { x: 35, y: 10 })).toBe(1);
    expect(midpointAt(square, { x: 38, y: 10 })).toBe(-1);
  });

  it('splits the edge its midpoint index named', () => {
    const split = insertVertex(doc, 'area', 1, { x: 30, y: 10 });
    expect(split.elements[0]?.points).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ]);
  });

  it('appends when the index is past the end — which is how a shape is drawn', () => {
    const grown = insertVertex(doc, 'area', 99, { x: 10, y: 60 });
    expect(grown.elements[0]?.points?.at(-1)).toEqual({ x: 0, y: 50 });
  });

  it('removes a vertex', () => {
    expect(removeVertex(doc, 'area', 1).elements[0]?.points).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ]);
  });

  it('refuses the removal that would stop it being a polygon', () => {
    const three = (square.points ?? []).slice(0, 3);
    const triangle = { ...doc, elements: [{ ...square, points: three }] };
    expect(removeVertex(triangle, 'area', 0)).toEqual(triangle);
    // The same three points as a line have one to spare.
    const line = { ...doc, elements: [{ ...square, type: 'line' as const, points: three }] };
    expect(removeVertex(line, 'area', 0).elements[0]?.points).toHaveLength(2);
  });

  it('starts a blank shape with one vertex, and a blank marker with none', () => {
    expect(blankShape('line', 'path', { x: 5, y: 6 })).toMatchObject({
      position: { x: 5, y: 6 },
      points: [{ x: 0, y: 0 }],
    });
    expect('points' in blankShape('marker', 'point', { x: 0, y: 0 })).toBe(false);
  });
});
