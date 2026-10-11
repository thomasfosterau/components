/**
 * `@thomasfosterau/components-mapbox` — a static raster, the interactive Mapbox
 * GL surface, the one that upgrades from the first to the second, the plan
 * editor, and the seam between the editor's shapes and a stored GeoJSON
 * geometry.
 *
 * A package of its own, adjacent to `@thomasfosterau/components`, because
 * these five components need a specific third-party engine — `mapbox-gl` — and
 * the core library stays free of it. `mapbox-gl` is this package's REQUIRED
 * peer: installing this package is the decision to render a map.
 *
 * Mapbox GL is still reached only through `DynamicMap`'s dynamic `import()`:
 * importing this barrel pulls in no mapping engine on the always-loaded path,
 * and the engine arrives only on a route that renders a live map. `StaticMap`
 * depends on nothing but an access token and arithmetic; `MapEditor` does not
 * depend even on the token, which is what keeps it working on a build that has
 * no Mapbox credential at all.
 *
 * @module
 */

export { default as DynamicMap } from './DynamicMap.svelte';
export { default as Map } from './Map.svelte';
export { default as MapEditor } from './MapEditor.svelte';
export { default as MapShapeView } from './MapShapeView.svelte';
export { default as StaticMap } from './StaticMap.svelte';
export { staticMapUrl, type StaticMapRequest, type StaticView } from './static-url.ts';
export {
  blankShape,
  dragShape,
  dragVertex,
  edgeMidpoints,
  HANDLE_TOLERANCE,
  insertVertex,
  isDrawable,
  midpointAt,
  removeVertex,
  shapeAt,
  shapeBounds,
  shapePath,
  shapeVertices,
  vertexAt,
  type MapEdit,
  type MapShape,
} from './shapes.ts';
export {
  canvasFromGeo,
  DEFAULT_SCALE_EXPONENT,
  geoFrame,
  geoFromCanvas,
  geometryFrame,
  geometryShapes,
  shapesGeometry,
  type GeoCoordinates,
  type GeoFrame,
  type GeoGeometry,
  type GeometryImport,
  type GeoPosition,
  type Unrepresentable,
} from './geojson.ts';
export type { BoundingBox, LngLat, MapCamera, MapStyle } from './types.ts';
