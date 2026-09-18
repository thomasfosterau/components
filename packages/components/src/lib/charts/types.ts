/**
 * The shapes `Chart` renders.
 *
 * @module @thomasfosterau/components/charts/types
 */

/** One observation: a category (or ordered period) and its magnitude. */
export interface ChartPoint {
  /** The x-axis tick, already localised by the caller. */
  readonly label: string;
  readonly value: number;
}

/**
 * One series. `key` is stable identity, and identity is what picks the colour —
 * so a filter that removes a series never repaints the survivors.
 */
export interface ChartSeries {
  readonly key: string;
  /** The legend entry and the direct label, already localised. */
  readonly label: string;
  /**
   * The points, in x order, one per category. Every series shares the first
   * series' categories: a chart whose series disagree about the x axis is two
   * charts.
   */
  readonly points: readonly ChartPoint[];
}

/** How the magnitude is drawn. */
export type ChartKind = 'line' | 'area' | 'bar';
