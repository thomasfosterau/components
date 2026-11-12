---
'@thomasfosterau/components': patch
---

`Carousel` reads the slide in view from the strip's scroll position when its `IntersectionObserver` fires, so a late batch describing an earlier position (the initial "first slide in view" landing after a Next press had already scrolled) no longer pulls the bound `index` back.
