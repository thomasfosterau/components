---
'@thomasfosterau/components': minor
---

Add `NavigationProgress`, the thin top-of-page bar for client-side navigation and long requests, driven by a per-app store (`setNavigationProgress`, `getNavigationProgress`, `createNavigationProgress`) with counted `start()`/`done()` and real progress through `set` and `increment`. It shows nothing for quick operations, reports no value while it trickles, and holds still under reduced motion.
