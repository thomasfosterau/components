---
'@thomasfosterau/components': minor
---

Add `NavigationRail`, the medium-width primary navigation: an ~80px column of icon-over-label links in a named navigation landmark, the current one `aria-current="page"` with its `currentIcon` in an indicator pill, optional `header`/`footer` slots, `labels="current"` (hidden labels stay the links' names and show in a tooltip), and badges named in words. Add the shared `NavDestination` type. `AppShell` gains an adaptive mode: given `destinations`, it renders a `BottomNav` below `breakpoints.medium`, a `NavigationRail` up to `breakpoints.expanded` and a `Sidebar` (the `sidebar` snippet, or one built from the destinations) above it, switched by CSS with exactly one navigation landmark at any width; `sidebar` is optional in that mode, and `label`, `brand`, `account`, `breakpoints` and `badgeLabel` are new props. `BottomNavItem` gains `currentIcon`.
