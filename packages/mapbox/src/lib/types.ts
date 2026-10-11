/**
 * The shapes the map components share.
 *
 * @module @thomasfosterau/components-mapbox/types
 */

/** A WGS 84 position. */
export interface LngLat {
  /** −180…180. */
  readonly longitude: number;
  /** −85.0511…85.0511 (the Web Mercator limit). */
  readonly latitude: number;
}

/** A south-west / north-east box. */
export interface BoundingBox {
  readonly min: LngLat;
  readonly max: LngLat;
}

/** Which Mapbox style to draw, and who owns it. */
export interface MapStyle {
  /** The style's Mapbox account — `mapbox` for the stock styles. */
  readonly username: string;
  /** The style id — `streets-v12`, `outdoors-v12`, or a custom one. */
  readonly styleId: string;
}

/** Where the camera sits. */
export interface MapCamera {
  readonly centre: LngLat;
  /** 0…22; fractional levels are rounded to two places by the static API. */
  readonly zoom: number;
  /** Degrees clockwise from north. */
  readonly bearing?: number | undefined;
  /** Degrees of tilt, 0…60. */
  readonly pitch?: number | undefined;
}
