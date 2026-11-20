---
'@thomasfosterau/components': patch
---

`BottomSheet`: a drag on the grabber now rests where the pointer was released, not where the last `pointermove` left it, so a quick drag that ends before any move is dispatched still lands on the right detent.
