/**
 * The Mapbox Static Images API URL builder.
 *
 * A plain function, not part of the component, because a URL is the one thing
 * about a map that can be asserted without a browser — and two bugs a unit test
 * catches on sight live exactly here: forgetting to append the access token (so
 * every request is a 401), and writing `max.longitude` twice where the fourth
 * term of a bounding box is `max.latitude`.
 *
 * @module @thomasfosterau/components-mapbox/static-url
 */

import type { BoundingBox, MapCamera, MapStyle } from './types.ts';

const BASE = 'https://api.mapbox.com';

/**
 * How a static map is framed: by a camera, by a bounding box to fit, or
 * automatically around its overlay.
 */
export type StaticView =
  /** The camera, as `lon,lat,zoom,bearing,pitch`. */
  | { readonly kind: 'camera'; readonly camera: MapCamera }
  /** A box the endpoint fits to the requested size. */
  | { readonly kind: 'bbox'; readonly bbox: BoundingBox }
  /** Let the endpoint frame the overlay; meaningless without one. */
  | { readonly kind: 'auto' };

/** Everything `staticMapUrl` needs to build one Static Images API URL. */
export interface StaticMapRequest {
  readonly style: MapStyle;
  readonly view: StaticView;
  /** CSS pixels; the endpoint caps each at 1280. */
  readonly width: number;
  readonly height: number;
  /** A public-scope Mapbox token — safe in a URL by design. */
  readonly accessToken: string;
  /** A GeoJSON overlay, serialised into the path. */
  readonly overlay?: unknown | undefined;
  /** Request the 2× raster for a high-density display. */
  readonly retina?: boolean | undefined;
}

const viewSegment = (view: StaticView): string => {
  if (view.kind === 'auto') return 'auto';
  if (view.kind === 'bbox') {
    const { min, max } = view.bbox;
    return `[${min.longitude},${min.latitude},${max.longitude},${max.latitude}]`;
  }
  const { centre, zoom, bearing = 0, pitch = 0 } = view.camera;
  return `${centre.longitude},${centre.latitude},${zoom},${bearing},${pitch}`;
};

/**
 * Build the image URL for one static map request.
 *
 * The overlay is `encodeURIComponent`d rather than interpolated raw: a GeoJSON
 * string carries `{`, `"` and `,`, and the path grammar reads commas as its own
 * separators — an un-encoded overlay silently becomes a different request.
 */
export const staticMapUrl = (request: StaticMapRequest): string => {
  const overlay =
    request.overlay === undefined
      ? ''
      : `${encodeURIComponent(`geojson(${JSON.stringify(request.overlay)})`)}/`;
  const size = `${Math.round(request.width)}x${Math.round(request.height)}${request.retina === true ? '@2x' : ''}`;
  const path = `/styles/v1/${request.style.username}/${request.style.styleId}/static/${overlay}${viewSegment(request.view)}/${size}`;
  const url = new URL(path, BASE);
  url.searchParams.set('access_token', request.accessToken);
  return url.href;
};
