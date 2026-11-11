---
'@thomasfosterau/components': minor
---

`Table` and `DataGrid` gain row selection and reader-hideable columns. `selection="multiple"` adds a native checkbox per row and a tri-state select-all over the rows in hand; `selection="single"` a radio per row. `selected` is a bindable `Set` of row keys, kept across sorting, filtering and paging, and `bulkActions` renders into a `role="toolbar"` named by the live "N selected" count while anything is selected. `hiddenColumns` (bindable) removes columns' cells, `columnMenu` offers them in a "Columns" menu of checkbox items, and `TableColumn` takes `hideable` and `defaultHidden`; the first column is never hidden. Selection never triggers `onSelect`'s row activation. The `data` family exports `TableSelection`, `TableBulkActions`, `pageSelectionState`, `withKeys`, `isColumnHideable` and `defaultHiddenColumns`.
