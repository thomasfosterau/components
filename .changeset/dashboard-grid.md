---
'@thomasfosterau/components': minor
---

Add `DashboardGrid`: tiles the reader arranges in edit mode, by dragging or keyboard (Space, arrows, Space) on a Move handle or through a tile menu with size presets, move up, down, to start or end, and remove. Add widget brings removed tiles back, and Reset layout restores `defaultLayout` after a confirmation. The bindable `layout` is stored at the widest column count; a narrower grid stacks the tiles in reading order. The DOM order always follows the layout, and every change is announced.
