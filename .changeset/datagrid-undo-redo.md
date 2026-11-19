---
'@thomasfosterau/components': minor
---

`DataGrid`: undo and redo for cell edits (#424). An editing grid keeps an undo history (`undo`, on by default): in navigation mode Ctrl/⌘+Z undoes the last committed edit and Ctrl/⌘+Shift+Z or Ctrl+Y redoes it. In `'batch'` an undo restores `changes` to its previous state; in `'cell'` it calls `onCellCommit` with the inverse change, with the same busy state and rollback. Each undo and redo is announced through the grid's polite region (`undoneLabel`, `redoneLabel`). New type `CellTarget<T>` (`{ row, column }`), which `CellError<T>` now extends.
