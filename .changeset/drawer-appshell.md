---
'@thomasfosterau/components': minor
---

Add `Drawer` (feedback family) and `AppShell` (layout family).

- `Drawer` is a modal panel at an edge (`start` / `end` / `top` / `bottom`). It shares `Dialog`'s internal body, so focus, dismissal and labelling are one implementation. The new `drawerSide`, `drawerWidth` and `drawerHeight` tables are in `feedback/sizes.ts`.
- `AppShell` shows the sidebar as a standing column from `lg` up and in a navigation drawer below it, keeping a single `navigation` landmark.
