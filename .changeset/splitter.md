---
'@thomasfosterau/components': minor
---

New `Splitter` in `layout`: two panes, side by side or stacked, with an APG window-splitter handle between them (a focusable `role="separator"` named by `handleLabel`, with its value range and `aria-controls`). Drag it, or use the arrow keys (mirrored under RTL), Home and End; with `collapsible`, Enter collapses the leading pane and restores it. `size` (percent of the leading pane) is bindable and clamped to `minSize`/`maxSize`, and `onCommit` reports each settled size once per key press or drag. Nest one in a pane for three-way layouts. No new dependency.
