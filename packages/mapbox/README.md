# @thomasfosterau/components-mapbox

Maps for [`@thomasfosterau/components`](https://github.com/thomasfosterau/components/blob/trunk/packages/components/README.md): a static raster, the interactive [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) surface, the one that upgrades from the first to the second, a plan editor, and the seam between the editor's shapes and a stored GeoJSON geometry.

It is a separate package so that an application that renders no map never installs `mapbox-gl`.

## Install

```sh
pnpm add @thomasfosterau/components-mapbox @thomasfosterau/components mapbox-gl
```

`mapbox-gl` (`^3.33.0`) is a required peer. Its stylesheet is imported by `DynamicMap` itself; you do not import it. Add this package's `dist/` to Tailwind's `@source` beside the core library's. Peers and the CSS are in the [setup guide](https://github.com/thomasfosterau/components/blob/trunk/docs/mapbox-setup.md).

## Example

```svelte
<script lang="ts">
  import { Map } from '@thomasfosterau/components-mapbox';

  let { accessToken }: { accessToken: string } = $props();
</script>

<Map
  {accessToken}
  style={{ username: 'mapbox', styleId: 'outdoors-v12' }}
  camera={{ centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 }}
  width={640}
  height={360}
  alt="The site's location in Melbourne"
/>
```

## Exports

Everything comes from the package root. Props, snippets and ARIA are in each component's doc comment.

| Export | What it is |
| --- | --- |
| `StaticMap` | One raster from the Mapbox Static Images API; no JavaScript, renders on the server |
| `DynamicMap` | The interactive WebGL map, with a fallback when WebGL is unavailable |
| `Map` | The raster first, the live map once the page has hydrated |
| `MapEditor` | A plan-drawing surface for areas, paths and points |
| `MapShapeView` | How one plan shape is drawn (`<g>` inside an `<svg>`) |
| `staticMapUrl` | The Static Images API URL as a plain function |
| `blankShape`, `shapeAt`, `vertexAt`, `dragShape`, `insertVertex`, `removeVertex`, and the rest of the shape geometry | Pure functions over `MapShape` |
| `geoFrame`, `geometryFrame`, `geometryShapes`, `shapesGeometry`, `canvasFromGeo`, `geoFromCanvas` | The GeoJSON seam |
| `LngLat`, `BoundingBox`, `MapStyle`, `MapCamera`, `MapShape`, `MapEdit`, `GeoGeometry`, `GeoFrame` and related types | Types |

## Guides

- [Setup and peers](https://github.com/thomasfosterau/components/blob/trunk/docs/mapbox-setup.md)
- [The plan editor](https://github.com/thomasfosterau/components/blob/trunk/docs/mapbox-plan-editor.md)
- [The GeoJSON seam](https://github.com/thomasfosterau/components/blob/trunk/docs/mapbox-geojson.md)

## License

MIT © Thomas Foster
