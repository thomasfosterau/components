---
'@thomasfosterau/components': minor
---

Add `SignaturePad`: draw a signature as SVG strokes (Undo, Clear, one stroke at a time for palm rejection) or type a name instead, the keyboard path, in `Draw` / `Type` tabs. Posts the SVG under `name`, blocks the form while empty when `required`, and warns in development when `allowTyped` is off. Also exports `signatureToPng` and the `SignatureValue` type.
