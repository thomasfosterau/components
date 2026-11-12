---
'@thomasfosterau/components': minor
---

`DataGrid` takes `editing="cell" | "batch"`: the table becomes an APG Grid with one Tab stop and arrow-key navigation, and columns marked `editable` are edited in place with the library's own `TextInput`, `NumberField`, `Select`, `DateField` and `Checkbox` (or a snippet). Edits are validated (`validate`, `parse`, `format`), cells in error are marked and summarised in a polite live region, `'cell'` saves each commit through `onCellCommit(change, signal)` with busy state and rollback on rejection, and `'batch'` collects them in a bindable `changes`. `TableColumn` gains `editable`, `editor`, `editValue`, `options`, `validate`, `parse` and `format`; `data` exports the types `TableEditing`, `CellChange`, `CellEditor`, `CellEditorContext` and `CellError`. A non-editing `DataGrid` and `Table` are unchanged.
