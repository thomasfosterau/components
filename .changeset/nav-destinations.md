---
'@thomasfosterau/components': minor
---

`Sidebar` and `BottomNav` take `destinations` (a `readonly NavDestination[]`, plus `badgeLabel`), so an app without `AppShell` declares its destinations once. `BottomNav` leaves out `compact: false`; `children` still work and render after the destinations. `children` is now optional on both. `AppShell` builds its sidebar and bottom bar through the same props.
