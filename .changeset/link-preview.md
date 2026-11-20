---
'@thomasfosterau/components': minor
---

Add `LinkPreview`, a card of supplementary detail shown while a link is hovered or keyboard-focused, on bits-ui's `LinkPreview`. The link keeps its own semantics (bits-ui's button and popup attributes are dropped), the card is outside the Tab order, and `load` fetches its data once, with an `AbortSignal` and a skeleton while pending.
