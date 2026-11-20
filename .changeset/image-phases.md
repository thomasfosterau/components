---
'@thomasfosterau/components': minor
---

`Image` gains loading phases: a `placeholder` (a tiny preview, a colour or a skeleton) painted as the image's background while it loads, a fade-in once loaded (`fade`), an error `fallback` that keeps the alt text visible with an optional Retry (`retryable`, `errorLabel`, `retryLabel`), and a bindable `phase`. `thumbHashPlaceholder` decodes a ThumbHash into a placeholder, with a vendored MIT decoder (`thumbHashToRgba`, `thumbHashAverage`, `thumbHashAspectRatio`, `thumbHashBytes`, `rgbaToDataUrl`).
