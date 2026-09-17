import type { Datum } from '@thomasfosterau/chart-spec';

/** A positioned point on a line or area outline, in plot pixels. */
export interface SeriesPoint {
  readonly x: number;
  readonly y: number;
  readonly datum: Datum;
}

/** One series of a line or area chart (split by the colour channel if present). */
export interface Series {
  /** The colour-channel category this series represents, or null for the single unsplit series. */
  readonly key: string | null;
  /** Resolved series colour, or undefined when no colour encoding is present. */
  readonly color: string | undefined;
  readonly points: ReadonlyArray<SeriesPoint>;
  /** SVG path data ("d" attribute) for the series. Empty string when there are no points. */
  readonly path: string;
}

/** Geometry for a line chart. */
export interface LineGeometry {
  readonly mark: 'line';
  readonly series: ReadonlyArray<Series>;
}

/** Geometry for an area chart. Paths are closed down to the zero baseline. */
export interface AreaGeometry {
  readonly mark: 'area';
  readonly series: ReadonlyArray<Series>;
}

/** A single bar, in plot pixels. */
export interface BarRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Resolved bar colour, or undefined when no colour encoding is present. */
  readonly color: string | undefined;
  readonly datum: Datum;
}

/** Geometry for a bar chart. */
export interface BarGeometry {
  readonly mark: 'bar';
  readonly bars: ReadonlyArray<BarRect>;
}

/** A single point symbol, in plot pixels. */
export interface PointCircle {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  /** Resolved point colour, or undefined when no colour encoding is present. */
  readonly color: string | undefined;
  readonly datum: Datum;
}

/** Geometry for a scatter/point chart. */
export interface PointGeometry {
  readonly mark: 'point';
  readonly points: ReadonlyArray<PointCircle>;
}

/** Chart geometry, discriminated by mark. */
export type Geometry = LineGeometry | BarGeometry | PointGeometry | AreaGeometry;
