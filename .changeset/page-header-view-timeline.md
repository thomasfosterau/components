---
'@thomasfosterau/components': patch
---

`PageHeader` `scrollBehavior="collapse"` fades its compact title on a CSS view timeline where the browser supports scroll-driven animations, so no scroll handler runs; elsewhere the scroll handler stays as the fallback. The compact bar also follows `--navbar-offset` as it changes, so it stays under a hide-on-scroll `Navbar`.
