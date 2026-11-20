---
'@thomasfosterau/components': minor
---

`Table` / `DataGrid`: select-all's second step. Once every row on the page is selected and there are more rows than the page, the selection toolbar offers "Select all <n>" (`selectAllTotalLabel`); taking it makes the count read "All <n> selected" (`allSelectedLabel`) beside a "Clear selection" button (`clearSelectionLabel`), which takes focus. `DataGrid` wires it up itself and selects every filtered row on every page; `Table` takes `selectAllTotal` and `onSelectAllTotal` for a paged caller.
