---
'@thomasfosterau/components': minor
---

`DataGrid` (editing): Shift+arrow keys select a block of cells (`aria-selected`, with `aria-multiselectable` on the grid), which Ctrl/⌘+C copies as tab-separated lines. A block pasted from a spreadsheet fills the cells from the block's top-left or the active cell, and one value pasted over a selected block fills every cell in it: all or nothing, as one undoable edit. A block that runs past the grid announces the new `pasteOutsideLabel` prop.
