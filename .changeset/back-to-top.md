---
'@thomasfosterau/components': minor
---

feat(layout): `BackToTop`, a "Back to top" link that appears once the reader has scrolled past `threshold`, scrolls back to the top (instantly under `prefers-reduced-motion`) and moves focus to the target (`Main` by default), so the next Tab continues from the top. `inline` (sticky at the end of the content) or `floating` (a fixed corner button, offset by `--back-to-top-offset`). `SkipLink`'s focus handling now lives in a shared internal helper.
