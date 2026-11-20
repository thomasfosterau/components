---
'@thomasfosterau/components': minor
---

`DataGrid`: copy and paste a cell. In an editing grid's navigation mode, Ctrl/⌘+C copies the focused cell's text (its `format`, a date's ISO form, else the value), and Ctrl/⌘+V pastes into an editable cell: the text is read as its editor would read it (`parse` for text, a number, a select option by value or label, an ISO date), checked by `validate` and committed as one undoable edit without moving. Text the cell cannot take commits nothing and marks the cell in error with the new `pasteFailedLabel` (default "That can't go in this cell.") or the validation messages.
