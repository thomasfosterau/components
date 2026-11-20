---
'@thomasfosterau/components': minor
---

`ImageInput` takes a `crop` option that opens `ImageCropper` in a dialog once a file is chosen. `output: 'area'` binds the crop as `area` and posts it beside the original file; `output: 'blob'` replaces the file with the cropped image. Cancel keeps the uncropped file and returns focus to the file input. `ImageInput` also now calls its own `onSelect`, which it used to drop.
