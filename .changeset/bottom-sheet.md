---
'@thomasfosterau/components': minor
---

New `BottomSheet` in `feedback`: a panel that rises from the bottom edge and rests at one of several `detents` (fractions of the viewport height, or `'content'`), with a bindable `detent`. Its grabber is a focusable `role="slider"` (`handleLabel`, `detentLabels` as `aria-valuetext`) moved by ↑/↓, Home and End, or dragged with the pointer: it snaps to the nearest detent, or one further on a flick, and dragging below the lowest closes it while `dismissible`. Modal by default, on the same dialog frame as `Drawer`; `modal={false}` renders a named region that leaves the page usable, where Escape collapses rather than closes. New type `SheetDetent`.
