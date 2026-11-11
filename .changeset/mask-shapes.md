---
'@thomasfosterau/components': minor
---

Add the `MaskShape` type and `maskShape` class table (daisyUI's `mask` shapes), and widen `Avatar`'s `shape` to take them: the mask goes on the inner picture frame, never on the named element or anything focusable. An `Image` takes a mask through `class={maskShape.hexagon}`.
