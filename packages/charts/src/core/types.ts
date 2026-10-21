import type { Datum } from '../spec/index.ts';
import type { Geometry } from './geometry/types.ts';

/** A measured box: the outer pixel dimensions available to the chart. */
export interface Box {
  readonly width: number;
  readonly height: number;
}

/** Margins between the outer box and the plot area, in pixels. */
export interface Margins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Resolved chart dimensions. */
export interface Dimensions {
  readonly outer: Box;
  readonly margins: Margins;
  /** The inner plot area (outer minus margins). All geometry is in plot coordinates. */
  readonly plot: Box;
}

/** A value in a scale's domain. */
export type DomainValue = number | string | Date;

/**
 * The kind of a resolved scale.
 *
 * - `linear` — continuous, for quantitative encodings
 * - `utc` — continuous time (UTC for cross-platform determinism), for temporal encodings
 * - `band` — categorical with bandwidth, for ordinal/nominal encodings on bar marks
 * - `point` — categorical positions, for ordinal/nominal encodings on line/point/area marks
 * - `ordinal` — discrete mapping (e.g. category → colour)
 */
export type ScaleKind = 'linear' | 'utc' | 'band' | 'point' | 'ordinal';

/**
 * A resolved scale: a callable mapping plus its serialisable description.
 *
 * `kind`, `domain`, and `range` fully describe the scale, so interpreters
 * that cannot consume the closure (or future native ports reading a
 * serialised context) can reconstruct the mapping.
 */
export interface ResolvedScale {
  readonly kind: ScaleKind;
  readonly domain: ReadonlyArray<DomainValue>;
  readonly range: ReadonlyArray<number> | ReadonlyArray<string>;
  /** Applies the scale. Returns undefined when the value is not mappable. */
  readonly apply: (value: DomainValue) => number | string | undefined;
  /** Band width in pixels. Zero for non-band scales. */
  readonly bandwidth: number;
}

/** The resolved scales for a chart, keyed by channel. */
export interface ChartScales {
  readonly x?: ResolvedScale;
  readonly y?: ResolvedScale;
  readonly color?: ResolvedScale;
  readonly size?: ResolvedScale;
}

/** An axis tick. */
export interface Tick {
  readonly value: DomainValue;
  /** Position along the axis, in plot pixels. */
  readonly position: number;
  readonly label: string;
}

/** Axis ticks, keyed by positional channel. */
export interface ChartTicks {
  readonly x?: ReadonlyArray<Tick>;
  readonly y?: ReadonlyArray<Tick>;
}

/**
 * Everything an interpreter needs to draw a chart: dimensions, scales,
 * geometry, and ticks. Produced by `computeContext`; pure data plus
 * scale closures, no DOM and no rendering.
 */
export interface ChartContext {
  readonly dimensions: Dimensions;
  readonly scales: ChartScales;
  readonly geometry: Geometry;
  readonly ticks: ChartTicks;
}

/** Options for `computeContext`. */
export interface ComputeContextOptions {
  /** Margin overrides. Defaults: top 20, right 20, bottom 40, left 48. */
  readonly margins?: Partial<Margins>;
}

/** Resolved data rows: what the host passes after resolving any data ref. */
export type DataRows = ReadonlyArray<Datum>;
