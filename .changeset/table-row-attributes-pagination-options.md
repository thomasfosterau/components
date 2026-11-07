---
'@thomasfosterau/components': minor
---

`Table` and `DataGrid` take `rowAttributes(row)` for a body row's own `class` and `id`, and a `TableColumn` takes `headerClass` for its header cell only. Activatable rows (`onSelect`) keep their hover tint, which the spread `class` used to replace. `Pagination` takes `chevrons={false}`, `unavailableArms="omit"`, and an optional `total` with `hasMore` for a listing that only knows whether there is more.
