---
'@thomasfosterau/components': minor
---

Add `ByteSize` and `formatBytes` (`formatting`): a byte count in the largest sensible unit, SI (`'file'`, base 1000) or IEC (`'memory'`, base 1024), locale-formatted, with the short unit read in full by screen readers. `FileInput`'s default `tooLargeMessage` now names the limit ("That file is too large. The limit is 4.2 MB.").
