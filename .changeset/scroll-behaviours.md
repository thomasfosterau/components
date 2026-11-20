---
'@thomasfosterau/components': minor
---

`Navbar` gains `scrollBehavior` (`'pinned'` or `'hide-on-scroll'`, which comes back on scroll up or focus and stays pinned under reduced motion), `elevateOnScroll` and `scrollContainer`; a stuck bar sets `--navbar-offset` and `scroll-padding-top` so anchors land below it. `PageHeader` gains `scrollBehavior="collapse"` with `collapsedTitle`: an `aria-hidden` compact title fades in as the large title scrolls away, keeping one heading and no layout shift.
