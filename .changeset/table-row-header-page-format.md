---
'@thomasfosterau/components': minor
---

`Table` row headers and `Pagination` page-number formatting.

- `TableColumn` takes `rowHeader?: boolean`: that column's body cells render as `<th scope="row">`, so a screen reader moving down another column announces the row's name with each cell. `DataGrid` passes it through, because it shares the column spec.
- `Pagination` (and `PaginationFooter`) take `formatPage?: (page) => string` for the visible page digits, e.g. `(page) => new Intl.NumberFormat('en-AU').format(page)` for "1,000". Page numbers stay bare by default; `pageLabel` is still the accessible name.
