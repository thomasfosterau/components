---
'@thomasfosterau/components': minor
---

`Toolbar` and `ButtonGroup` take their controls as `items` and an `item` snippet, and with `overflow` move the ones that don't fit into a trailing "More" menu. In a `Toolbar`, "More" is the last arrow-key stop, hidden controls leave the arrow-key order and the toolbar stays one Tab stop. `Overflow` gains a `trigger` snippet for rendering the "More" button and an `onHiddenChange` callback, and marks a hidden item's attributes with `data-overflow-hidden`.
