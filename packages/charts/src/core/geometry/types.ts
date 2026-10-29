import type { Datum } from '../../spec/index.ts';

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

/** A node of a `tree` mark (spec 1.1), as a box in plot pixels, in depth-first order. */
export interface TreeNodeBox {
  /** The row's id. */
  readonly id: string;
  /** The text drawn in the box (the label channel, else the id). */
  readonly label: string;
  /** Depth from the root, 0 for a root. */
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Resolved node colour, or undefined when no colour encoding is present. */
  readonly color: string | undefined;
  readonly datum: Datum;
}

/** A link from a parent node to a child, as SVG path data in plot pixels. */
export interface TreeLink {
  readonly from: string;
  readonly to: string;
  readonly path: string;
}

/** One entry of a tree's outline: the nested, depth-first text alternative. */
export interface TreeOutlineNode {
  readonly id: string;
  readonly label: string;
  /** The colour-channel category named in words, so colour is never the only carrier. */
  readonly category: string | undefined;
  readonly children: ReadonlyArray<TreeOutlineNode>;
}

/** Geometry for a `tree` mark (spec 1.1). */
export interface TreeGeometry {
  readonly mark: 'tree';
  /** Node boxes, in depth-first order. */
  readonly nodes: ReadonlyArray<TreeNodeBox>;
  /** One link per non-root node. */
  readonly links: ReadonlyArray<TreeLink>;
  /** The hierarchy as nested entries, for a nested-list text alternative. */
  readonly outline: ReadonlyArray<TreeOutlineNode>;
}

/** Chart geometry, discriminated by mark. */
export type Geometry = LineGeometry | BarGeometry | PointGeometry | AreaGeometry | TreeGeometry;
