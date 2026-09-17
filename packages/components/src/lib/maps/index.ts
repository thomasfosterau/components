/**
 * `@thomasfosterau/components/maps` — a static raster, the interactive Mapbox
 * GL surface, the one that upgrades from the first to the second, the plan
 * editor, and the seam between the editor's shapes and a stored GeoJSON
 * geometry.
 *
 * A separate entry point so it never sits on the always-loaded path of a
 * consumer that does not use it — and so `mapbox-gl` can stay an optional peer.
 *
 * Mapbox GL is reached only through `DynamicMap`'s dynamic `import()`:
 * importing this barrel pulls in no mapping engine, and an app that renders no
 * interactive map need not install one. `StaticMap` depends on nothing but an
 * access token and arithmetic; `MapEditor` does not depend even on the token,
 * which is what keeps it working on a build that has no Mapbox credential at
 * all.
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
