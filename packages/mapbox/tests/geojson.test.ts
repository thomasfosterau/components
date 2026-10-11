/**
 * Unit tests for the seam between a stored GeoJSON geometry and the shapes the
 * map editor edits.
 *
 * The headline claim is that a boundary comes back out of the editor as the
 * numbers it went in as, so the assertions are on `Object.is` rather than on
 * `toBeCloseTo`: a boundary that is nearly right after one save is a boundary
 * that has moved after twenty. The coordinates below are real full-precision
 * WGS 84 values for that reason — rounded ones would pass a test the arithmetic
 * had not earned.
 *
 * @module tests/geojson
 */

import { describe, expect, it } from 'vite-plus/test';
import {
  canvasFromGeo,
  DEFAULT_SCALE_EXPONENT,
  geoFrame,
  geoFromCanvas,
  geometryFrame,
  geometryShapes,
  shapesGeometry,
  type GeoFrame,
  type GeoGeometry,
  type GeoPosition,
} from '../src/lib/geojson.ts';
import { dragShape, type MapShape } from '../src/lib/shapes.ts';
import type { VectorDocument } from '@thomasfosterau/components/canvas';

/**
 * A fence line in Melbourne, at the precision a GPS fix actually has.
 *
 * Each literal is the SHORTEST decimal that round-trips to the double it names,
 * which is why two of them carry a long tail: those are the exact doubles that
 * come out of adding a small offset to a corner, and they are what a stored
 * boundary looks like once anything has been computed against it. Writing more
 * digits than a double holds would be a literal that silently rounds — the
 * opposite of what this file is testing.
 */
const RING: readonly GeoPosition[] = [
  [144.963321, -37.8141079],
  [144.963398, -37.814101300000004],
  [144.963412, -37.8141869],
  [144.963335, -37.81419390000001],
];

const polygon: GeoGeometry = {
  type: 'Polygon',
  coordinates: [[...RING, RING[0] as GeoPosition]],
};

/** Every ordinate of two geometries, so a comparison can be bit-for-bit. */
const ordinates = (value: unknown): readonly number[] =>
  Array.isArray(value) ? value.flatMap(ordinates) : typeof value === 'number' ? [value] : [];

/** The one geometry these shapes export to — thrown rather than skipped past. */
const soleGeometry = (frame: GeoFrame, shapes: readonly MapShape[]): GeoGeometry => {
  const [geometry] = shapesGeometry(frame, shapes);
  if (geometry === undefined) throw new Error('expected these shapes to export to one geometry');
  return geometry;
};

/** A polygon geometry's single ring. */
const soleRing = (geometry: GeoGeometry): readonly GeoPosition[] => {
  const [ring] = geometry.coordinates as readonly (readonly GeoPosition[])[];
  if (ring === undefined) throw new Error('expected a polygon carrying one ring');
  return ring;
};

const frameOf = (geometry: GeoGeometry) => {
  const [frame] = geometryFrame(geometry);
  if (frame === undefined) throw new Error('the fixture geometry has no coordinates');
  return frame;
};

describe('the geographic frame', () => {
  const frame = geoFrame({ longitude: 144.963321, latitude: -37.8141079 });

  it('puts its own origin at the canvas origin', () => {
    expect(canvasFromGeo(frame, [144.963321, -37.8141079])).toEqual({ x: 0, y: -0 });
  });

  it('flips the y axis, because latitude grows north and canvas y grows down', () => {
    expect(canvasFromGeo(frame, [144.963321, -37.8131079]).y).toBeLessThan(0);
    expect(canvasFromGeo(frame, [144.963321, -37.8151079]).y).toBeGreaterThan(0);
  });

  it('scales by a power of two, so the scale itself costs no precision', () => {
    expect(2 ** DEFAULT_SCALE_EXPONENT).toBe(1048576);
    const point = canvasFromGeo(frame, [144.963321 + 1, -37.8141079]);
    expect(point.x).toBe(2 ** DEFAULT_SCALE_EXPONENT);
  });

  it('round-trips every ordinate of a real fix exactly, not nearly', () => {
    // A sweep rather than the four fixture corners, because four coordinates
    // are four anecdotes. Each step walks a few ulps, so these are neighbouring
    // floats around a real fix — the population an editor actually writes.
    //
    // It does NOT distinguish a power-of-two scale from any other: multiplying
    // and dividing by the SAME constant recovers almost every float whatever
    // the constant, so this would still pass on a 1.5× scale. The power of two
    // is pinned structurally instead, by the test above — the point of it is
    // exactness that is provable for every input rather than observed on a
    // sample, which is a claim a round-trip test cannot make on its own.
    const swept = Array.from({ length: 512 }, (_unused, index) => {
      const [longitude = 0, latitude = 0] = RING[index % RING.length] ?? [];
      const steps = index - 256;
      return [longitude + steps * Number.EPSILON * 128, latitude - steps * Number.EPSILON * 128];
    });
    for (const position of [...RING, ...swept]) {
      const back = geoFromCanvas(frame, canvasFromGeo(frame, position));
      expect(Object.is(back[0], position[0])).toBe(true);
      expect(Object.is(back[1], position[1])).toBe(true);
    }
  });

  it("anchors a frame on the geometry's own first coordinate, and has none without one", () => {
    expect(frameOf(polygon).origin).toEqual({ longitude: RING[0]?.[0], latitude: RING[0]?.[1] });
    expect(geometryFrame({ type: 'MultiPoint', coordinates: [] })).toEqual([]);
  });
});

describe('importing a geometry', () => {
  const frame = frameOf(polygon);

  it("drops GeoJSON's repeated closing position — the editor closes a polygon itself", () => {
    const { shapes } = geometryShapes(frame, polygon, () => 'area');
    expect(shapes[0]?.points).toHaveLength(RING.length);
    expect(shapes[0]?.type).toBe('polygon');
  });

  it('anchors every shape at the canvas origin, so an untouched boundary adds nothing', () => {
    const { shapes } = geometryShapes(frame, polygon, () => 'area');
    expect(shapes[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it('reads a Point as a marker and a LineString as a line', () => {
    const point = geometryShapes(
      frameOf({ type: 'Point', coordinates: RING[0] as GeoPosition }),
      { type: 'Point', coordinates: RING[0] as GeoPosition },
      () => 'point',
    );
    expect(point.shapes[0]?.type).toBe('marker');
    expect('points' in (point.shapes[0] ?? {})).toBe(false);

    const line: GeoGeometry = { type: 'LineString', coordinates: RING };
    expect(geometryShapes(frame, line, () => 'path').shapes[0]?.type).toBe('line');
  });

  it('makes one shape per member of a Multi geometry', () => {
    const multi: GeoGeometry = {
      type: 'MultiPolygon',
      coordinates: [[[...RING, RING[0] as GeoPosition]], [[...RING, RING[0] as GeoPosition]]],
    };
    let seed = 0;
    const { shapes } = geometryShapes(frame, multi, () => `area-${(seed += 1)}`);
    expect(shapes.map((shape) => shape.id)).toEqual(['area-1', 'area-2']);
  });

  it('refuses an area with a hole rather than quietly serving a disc', () => {
    const donut: GeoGeometry = {
      type: 'Polygon',
      coordinates: [
        [...RING, RING[0] as GeoPosition],
        [...RING, RING[0] as GeoPosition],
      ],
    };
    expect(geometryShapes(frame, donut, () => 'area').unrepresentable).toEqual(['interior-ring']);
  });

  it('refuses an altitude rather than flattening a reading it cannot edit', () => {
    const raised: GeoGeometry = { type: 'Point', coordinates: [144.963321, -37.8141079, 31.5] };
    const { shapes, unrepresentable } = geometryShapes(frame, raised, () => 'point');
    expect(shapes).toEqual([]);
    expect(unrepresentable).toEqual(['altitude']);
  });

  it('refuses coordinates nested at a depth the type does not describe', () => {
    // Passes the stored column's schema, which validates the four depths as a
    // union without tying either to `type`.
    const wrong: GeoGeometry = { type: 'Polygon', coordinates: [144.963321, -37.8141079] };
    expect(geometryShapes(frame, wrong, () => 'area').unrepresentable).toEqual(['malformed']);
  });
});

describe('exporting shapes', () => {
  const frame = frameOf(polygon);
  const imported = geometryShapes(frame, polygon, () => 'area').shapes;

  it('returns the geometry it was given, ordinate for ordinate', () => {
    const out = soleGeometry(frame, imported);
    expect(out.type).toBe('Polygon');
    const before = ordinates(polygon.coordinates);
    const after = ordinates(out.coordinates);
    expect(after).toHaveLength(before.length);
    expect(after.every((value, index) => Object.is(value, before[index]))).toBe(true);
  });

  it('closes the ring with its own first position, so a closed ring stays identical', () => {
    const ring = soleRing(soleGeometry(frame, imported));
    expect(ring.at(-1)).toEqual(ring[0]);
  });

  it('survives the whole round trip a page performs: load, edit nothing, save', () => {
    const [reloaded] = shapesGeometry(frame, geometryShapes(frame, polygon, () => 'area').shapes);
    expect(reloaded).toEqual(polygon);
  });

  it("moves exactly one anchor's worth when an area is dragged, with nothing accumulated", () => {
    const doc: VectorDocument<MapShape> = {
      version: '1',
      metadata: {},
      viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
      grid: { visible: false, size: 10, snap: false, color: '' },
      elements: imported,
    };
    const step = 2 ** DEFAULT_SCALE_EXPONENT / 1024;
    const moved = dragShape(doc, 'area', { x: 0, y: 0 }, { x: 0, y: 0 }, { x: step, y: 0 });
    const ring = soleRing(soleGeometry(frame, moved.elements));
    expect(ring[0]?.[0]).toBeCloseTo((RING[0]?.[0] ?? 0) + 1 / 1024, 12);
    // The latitudes are untouched by a horizontal drag — bit-for-bit.
    expect(Object.is(ring[0]?.[1], RING[0]?.[1])).toBe(true);
  });

  it('chooses the Multi form only when there is more than one shape', () => {
    expect(shapesGeometry(frame, [...imported, ...imported])[0]?.type).toBe('MultiPolygon');
  });

  it('has no single geometry for a mixed selection — the schema has no GeometryCollection', () => {
    const marker: MapShape = { ...(imported[0] as MapShape), id: 'point', type: 'marker' };
    expect(shapesGeometry(frame, [...imported, marker])).toEqual([]);
  });

  it('has no geometry for an outline too short to be one, or for nothing at all', () => {
    const stub: MapShape = { ...(imported[0] as MapShape), points: [{ x: 0, y: 0 }] };
    expect(shapesGeometry(frame, [stub])).toEqual([]);
    expect(shapesGeometry(frame, [])).toEqual([]);
  });
});
