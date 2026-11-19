# The GeoJSON seam

How a stored GeoJSON geometry becomes shapes `MapEditor` can edit, and back. Exports: `geoFrame`, `geometryFrame`, `canvasFromGeo`, `geoFromCanvas`, `geometryShapes`, `shapesGeometry` and `DEFAULT_SCALE_EXPONENT`. Signatures and edge cases are in their doc comments; the reasoning is in the module comment of `packages/mapbox/src/lib/geojson.ts`.

## The frame

```text
canvas = (degrees - origin) x 2^scaleExponent, with y negated
```

It uses only operations that are exact (or, for the subtraction, exact for coordinates within a factor of two of the origin), so a geometry nobody has edited comes back out with the numbers it went in with. It is equirectangular, so a plan reads wider than it is away from the equator. A document in this frame wants `grid.snap: false`, or the grid quantises the boundary.

`DEFAULT_SCALE_EXPONENT` is 20: 2^20 canvas units to the degree, about 9.4 units to the metre at the equator, small enough that a whole site fits `VectorCanvas`'s 0.1 to 10 zoom range unscaled.

## Round trip

```ts
import {
  geometryFrame,
  geometryShapes,
  shapesGeometry,
  type GeoGeometry,
} from '@thomasfosterau/components-mapbox';

declare const stored: GeoGeometry;

const [frame] = geometryFrame(stored);
if (frame !== undefined) {
  const { shapes, unrepresentable } = geometryShapes(frame, stored);
  if (unrepresentable.length === 0) {
    // ...edit `shapes` in a MapEditor, then:
    const [saved] = shapesGeometry(frame, shapes);
  }
}
```

- `geometryFrame` returns a zero- or one-element array (empty when there is no coordinate to anchor on), so destructuring is the check. `shapesGeometry` follows the same idiom: empty when there are no shapes, the kinds are mixed, or an outline is not `isDrawable`.
- `geometryShapes` reports what it cannot represent in `unrepresentable` rather than flattening it: `'interior-ring'` (a polygon's holes, dropped), `'altitude'` or `'malformed'` (no shapes at all). Refuse to save when it is non-empty, or the reader will save a donut as a disc.
- `GeometryCollection` is not supported.
