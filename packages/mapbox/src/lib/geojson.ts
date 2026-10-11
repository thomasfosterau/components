/**
 * The seam between a stored GeoJSON geometry and the shapes `MapEditor` edits.
 *
 * ## The frame, and why it is exactly invertible
 *
 * A boundary is stored as GeoJSON — in a `jsonb` column, in a file — and must
 * come back out of the editor as the same numbers it went in as. That rules
 * out a
 * projection: a `cos φ` term would make a bed the right shape on screen, but
 * its inverse is not exact, and a boundary that drifts a little on every save
 * is a boundary that has moved by the end of the season.
 *
 * So the frame is the two operations that ARE exact, and nothing else:
 *
 * ```text
 * canvas = (degrees − origin) × 2^k        degrees = canvas ÷ 2^k + origin
 * ```
 *
 * - **The scale is a power of two, and it is given as the exponent** rather
 *   than as the scale itself, so a caller cannot hand it a 1.5. Multiplying and
 *   dividing a float by a power of two only shifts the exponent, so the scale
 *   contributes exactly zero error in either direction.
 * - **The origin is the geometry's own first coordinate.** It is not
 *   decoration: without it a garden near longitude 145° sits at x ≈ 1.5 × 10⁸
 *   canvas units, and SVG is rasterised through 32-bit floats, whose steps up
 *   there are ~16 units — about 1.7 m on the ground. That is the jitter every
 *   web map has at high zoom, and an editor that shows it is an editor that
 *   cannot place a bed against a fence.
 * - **The y axis is negated**, because latitude grows north and canvas y grows
 *   down. A negation is exact.
 *
 * The one inexact step left is the subtraction, and the honest statement of
 * what that costs is: `origin + (c − origin) === c` holds whenever `c` and
 * `origin` are within a factor of two of one another (Sterbenz's lemma). Every
 * coordinate of one garden is, by a very wide margin, which is what the
 * round-trip test pins with real full-precision WGS 84 values. It is NOT true
 * for arbitrary pairs of floats, and this comment says so rather than claiming
 * an exactness the arithmetic does not have.
 *
 * ## Why the geometry type is declared here
 *
 * Structurally the same as an application's own `GeoJsonGeometry`, and
 * deliberately not imported from one: a component that imported an app's model
 * layer would put the whole of it in every consumer's bundle, and a published
 * library has no app to import from in the first place. The app maps at the
 * seam.
 *
 * ## What is refused rather than flattened
 *
 * A {@link MapShape} carries ONE `points` array, so a `Polygon` with interior
 * rings has no representation here. Dropping them silently would turn a donut
 * bed into a disc — and the reader would then SAVE it that way, which is how a
 * viewer's rounding error becomes the record. So the import reports what it
 * could not take and the page decides; the same goes for a position carrying an
 * altitude, which the editor has no third axis for.
 *
 * @module @thomasfosterau/components-mapbox/geojson
 */

import { generateId, type Point } from '@thomasfosterau/components/canvas';
import { blankShape, isDrawable, shapeVertices, type MapShape } from './shapes.ts';
import type { LngLat } from './types.ts';

/** A GeoJSON position: `[longitude, latitude]`, optionally with an altitude. */
export type GeoPosition = readonly number[];

/** `coordinates` at the four nesting depths GeoJSON uses, as the model types them. */
export type GeoCoordinates =
  | GeoPosition
  | readonly GeoPosition[]
  | readonly (readonly GeoPosition[])[]
  | readonly (readonly (readonly GeoPosition[])[])[];

/**
 * A GeoJSON geometry object, structurally the model's `GeoJsonGeometry`.
 *
 * `GeometryCollection` is absent here because it is absent there — it is the
 * one geometry type whose payload is recursive, and a garden boundary is a
 * polygon or a multipolygon.
 */
export interface GeoGeometry {
  readonly type:
    | 'Point'
    | 'MultiPoint'
    | 'LineString'
    | 'MultiLineString'
    | 'Polygon'
    | 'MultiPolygon';
  readonly coordinates: GeoCoordinates;
}

/**
 * The local frame a plan is edited in: where its origin sits in the world, and
 * how many canvas units a degree is worth.
 */
export interface GeoFrame {
  readonly origin: LngLat;
  /** The scale is `2 ** scaleExponent`; see the module comment for why. */
  readonly scaleExponent: number;
}

/**
 * 2²⁰ canvas units to the degree — about 9.4 units to the metre at the
 * equator, so a 10 m bed is ~94 units across and the default 20-unit grid is
 * a couple of metres. Small enough that a whole garden fits the viewport's
 * 0.1–10 zoom range without the caller pre-scaling anything.
 */
export const DEFAULT_SCALE_EXPONENT = 20;

/** What an import could not represent, so the page can refuse rather than lie. */
export type Unrepresentable =
  /** A `Polygon`'s interior rings — a bed with a hole in it. */
  | 'interior-ring'
  /** A position with a third ordinate; the editor is flat. */
  | 'altitude'
  /** `coordinates` nested at a depth its `type` does not describe. */
  | 'malformed';

/** The shapes an import produced, and everything it had to leave behind. */
export interface GeometryImport {
  readonly shapes: readonly MapShape[];
  /** Deduplicated; empty when the whole geometry came across. */
  readonly unrepresentable: readonly Unrepresentable[];
}

const scaleOf = (frame: GeoFrame): number => 2 ** frame.scaleExponent;

/** A frame anchored at `origin`. */
export const geoFrame = (origin: LngLat, scaleExponent = DEFAULT_SCALE_EXPONENT): GeoFrame => ({
  origin,
  scaleExponent,
});

/** A GeoJSON position in canvas coordinates. */
export const canvasFromGeo = (frame: GeoFrame, position: GeoPosition): Point => {
  const scale = scaleOf(frame);
  // Destructured with zeros rather than indexed twice: a position short of two
  // ordinates is refused by `geometryShapes` before it ever reaches here, and
  // under `noUncheckedIndexedAccess` this is the total form of saying so
  // without a cast. The defaults are unreachable for valid input, and the
  // arithmetic for valid input is unchanged.
  const [longitude = 0, latitude = 0] = position;
  return {
    x: (longitude - frame.origin.longitude) * scale,
    y: -((latitude - frame.origin.latitude) * scale),
  };
};

/** A canvas point back as a GeoJSON position — {@link canvasFromGeo}'s inverse. */
export const geoFromCanvas = (frame: GeoFrame, point: Point): GeoPosition => {
  const scale = scaleOf(frame);
  return [point.x / scale + frame.origin.longitude, -point.y / scale + frame.origin.latitude];
};

/** The nesting depth of a `coordinates` value; a bare position is 1. */
const depthOf = (value: GeoCoordinates | number): number =>
  Array.isArray(value) ? 1 + (value.length === 0 ? 0 : depthOf(value[0] as GeoCoordinates)) : 0;

/** The depth each geometry type's `coordinates` must have to mean what it says. */
const DEPTHS = {
  Point: 1,
  MultiPoint: 2,
  LineString: 2,
  MultiLineString: 3,
  Polygon: 3,
  MultiPolygon: 4,
} as const;

/** The shape kind each geometry type edits as. */
const KINDS = {
  Point: 'marker',
  MultiPoint: 'marker',
  LineString: 'line',
  MultiLineString: 'line',
  Polygon: 'polygon',
  MultiPolygon: 'polygon',
} as const;

/**
 * Each polygon's exterior ring, and whether any interior ones had to be left
 * behind — the one place a bed with a hole is noticed.
 */
const exteriorRings = (
  polygons: readonly (readonly (readonly GeoPosition[])[])[],
): {
  readonly outlines: readonly (readonly GeoPosition[])[];
  readonly refused: readonly Unrepresentable[];
} => ({
  outlines: polygons.flatMap((rings) => rings.slice(0, 1)),
  refused: polygons.some((rings) => rings.length > 1) ? ['interior-ring'] : [],
});

/**
 * The geometry as a flat list of outlines, one per shape the editor will make,
 * alongside what had to be refused.
 *
 * The depth is checked rather than asserted because the stored column's schema
 * validates the four nesting depths as a UNION — a `Polygon` whose coordinates
 * are a bare position passes it. A cast here would be a lie about data that has
 * already been let through once.
 */
const outlinesOf = (
  geometry: GeoGeometry,
): {
  readonly outlines: readonly (readonly GeoPosition[])[];
  readonly refused: readonly Unrepresentable[];
} => {
  if (depthOf(geometry.coordinates) !== DEPTHS[geometry.type]) {
    return { outlines: [], refused: ['malformed'] };
  }
  switch (geometry.type) {
    case 'Point':
      return { outlines: [[geometry.coordinates as GeoPosition]], refused: [] };
    case 'MultiPoint':
      return {
        outlines: (geometry.coordinates as readonly GeoPosition[]).map((position) => [position]),
        refused: [],
      };
    case 'LineString':
      return { outlines: [geometry.coordinates as readonly GeoPosition[]], refused: [] };
    case 'MultiLineString':
      return { outlines: geometry.coordinates as readonly (readonly GeoPosition[])[], refused: [] };
    case 'Polygon':
      return exteriorRings([geometry.coordinates as readonly (readonly GeoPosition[])[]]);
    case 'MultiPolygon':
      return exteriorRings(
        geometry.coordinates as readonly (readonly (readonly GeoPosition[])[])[],
      );
  }
};

/**
 * A ring with GeoJSON's repeated closing position dropped.
 *
 * Only dropped when it IS the first position, ordinate for ordinate: a ring
 * that was never closed is malformed GeoJSON, and it is imported as it stands
 * and exported closed — a repair, not a loss.
 */
const openRing = (ring: readonly GeoPosition[]): readonly GeoPosition[] => {
  const last = ring.at(-1);
  const first = ring[0];
  if (ring.length < 2 || first === undefined || last === undefined) return ring;
  const closed =
    first.length === last.length && first.every((value, index) => Object.is(value, last[index]));
  return closed ? ring.slice(0, -1) : ring;
};

/**
 * A frame anchored on the geometry's own first coordinate, or none when it has
 * no coordinates to anchor on.
 *
 * None-or-one rather than a nullable frame, the idiom `boundingBox` set: the
 * empty case is the caller's `const [frame] = …` rather than a check they have
 * to remember.
 */
export const geometryFrame = (
  geometry: GeoGeometry,
  scaleExponent = DEFAULT_SCALE_EXPONENT,
): readonly GeoFrame[] => {
  const [longitude, latitude] = outlinesOf(geometry).outlines[0]?.[0] ?? [];
  // Two ordinates or no frame — which is also the `first.length < 2` check,
  // written as the destructuring `noUncheckedIndexedAccess` wants anyway.
  if (longitude === undefined || latitude === undefined) return [];
  return [geoFrame({ longitude, latitude }, scaleExponent)];
};

/**
 * The geometry as editable shapes in `frame`.
 *
 * Every shape is anchored at the canvas origin, its vertices carrying the whole
 * coordinate: adding a zero offset is exact, so a boundary nobody has dragged
 * comes back out of {@link shapesGeometry} bit-identical. Once the reader moves
 * a bed, its `position` is real and the export is an anchor plus an offset —
 * one addition, computed once, not a delta accumulated across a gesture.
 */
export const geometryShapes = (
  frame: GeoFrame,
  geometry: GeoGeometry,
  newId: () => string = generateId,
): GeometryImport => {
  const { outlines, refused } = outlinesOf(geometry);
  const kind = KINDS[geometry.type];
  const positions = outlines.flat();
  const ordinates: readonly Unrepresentable[] = [
    ...(positions.some((position) => position.length > 2) ? (['altitude'] as const) : []),
    ...(positions.some((position) => position.length < 2) ? (['malformed'] as const) : []),
  ];
  if (ordinates.length > 0) {
    return { shapes: [], unrepresentable: [...new Set([...refused, ...ordinates])] };
  }
  const shapes = outlines.flatMap((outline): readonly MapShape[] => {
    if (kind === 'marker') {
      const position = outline[0];
      if (position === undefined) return [];
      return [blankShape('marker', newId(), canvasFromGeo(frame, position))];
    }
    const ring = kind === 'polygon' ? openRing(outline) : outline;
    if (ring.length === 0) return [];
    return [
      {
        ...blankShape(kind, newId(), { x: 0, y: 0 }),
        points: ring.map((position) => canvasFromGeo(frame, position)),
      },
    ];
  });
  return { shapes, unrepresentable: [...new Set(refused)] };
};

/**
 * The shapes as one geometry, or none when they have no single one.
 *
 * None rather than a lie, in three cases, and the caller is told by the empty
 * array in all three: there are no shapes; they are of mixed kinds, for which
 * the stored schema deliberately has no `GeometryCollection`; or an outline is
 * below the vertex count that would make it the kind it claims to be.
 *
 * A polygon ring is closed on the way out by repeating its first position —
 * the same value, so a ring that arrived closed leaves closed and identical.
 */
export const shapesGeometry = (
  frame: GeoFrame,
  shapes: readonly MapShape[],
): readonly GeoGeometry[] => {
  const [first] = shapes;
  if (first === undefined) return [];
  if (shapes.some((shape) => shape.type !== first.type)) return [];
  if (shapes.some((shape) => shape.type !== 'marker' && !isDrawable(shape))) return [];

  const many = shapes.length > 1;
  if (first.type === 'marker') {
    const positions = shapes.map((shape) => geoFromCanvas(frame, shape.position));
    return [
      many
        ? { type: 'MultiPoint', coordinates: positions }
        : { type: 'Point', coordinates: positions[0] as GeoPosition },
    ];
  }

  const rings = shapes.map((shape) => {
    const vertices = shapeVertices(shape).map((vertex) => geoFromCanvas(frame, vertex));
    return first.type === 'polygon' && vertices[0] !== undefined
      ? [...vertices, vertices[0]]
      : vertices;
  });
  if (first.type === 'line') {
    return [
      many
        ? { type: 'MultiLineString', coordinates: rings }
        : { type: 'LineString', coordinates: rings[0] as readonly GeoPosition[] },
    ];
  }
  return [
    many
      ? { type: 'MultiPolygon', coordinates: rings.map((ring) => [ring]) }
      : { type: 'Polygon', coordinates: [rings[0] as readonly GeoPosition[]] },
  ];
};
