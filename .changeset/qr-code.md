---
'@thomasfosterau/components': minor
---

Add `QRCode` on a new `@thomasfosterau/components/qr` entry: a value as one accessible SVG path, with error correction, a quiet zone, an optional logo, SVG download and an expiring state. The encoder is a vendored copy of Nayuki's MIT-licensed `qrcodegen`, so there is no new dependency and the root barrel is unchanged.
