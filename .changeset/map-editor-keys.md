---
'@thomasfosterau/components-mapbox': minor
---

`MapEditor` has a keyboard path to every pointer edit (#135, upstreamed from the owner's app). `]` / `[` step between shapes and, inside a shape, between its vertices and edge midpoints. Arrows move the shape or vertex a grid step, five with Shift; on a midpoint they add a vertex and move it. Enter / Space go into a shape's handles or add a vertex at a midpoint. Delete / Backspace remove a vertex. Escape steps back out, and with a drawing tool it finishes the outline at once. With a drawing tool, a cursor moved by the arrows places vertices on Enter. A held arrow is one undo step, with the same transform the matching pointer drag commits. The focused part is named through `aria-activedescendant`, and edits are announced in a polite status region.

The copy is new props with English defaults: `keysDescription`, `shapeLabel`, `vertexLabel`, `midpointLabel`, `cursorLabel` and the `…Message` announcements. Coordinates are formatted with the new `locales` prop. `MapShapeView` gains `focus`, `focusId`, `focusLabel` and `focusVisible`.

Also fixed: switching tool mid-outline now finishes the outline straight away instead of on the next press, and an Alt-click refused by the minimum-vertex rule no longer reports a no-op committed edit.
