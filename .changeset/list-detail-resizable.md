---
'@thomasfosterau/components': minor
---

`ListDetailLayout`: a `resizable` divider. From `expandAt` up the border between the panes becomes `Splitter`'s window-splitter handle (a focusable `separator` named by `handleLabel`, default "Resize list", that controls the list region), moved by the arrow keys, Home / End or a drag. `listSize` (the list's width in percent of the layout) is bindable and clamped to `minListSize` / `maxListSize` (15 / 60); until it is set the list keeps its `listWidth` token. `onListResize` reports each settled size. `Splitter` now draws the same shared handle.
