---
'@thomasfosterau/components': minor
---

`Combobox` takes `onCreate(query, signal)`: a query that matches no option exactly ends the list with a "Create ‘query’" option, and choosing it selects the item the promise resolves to, with a busy state, a polite status and an error message (`createLabel`, `creatingLabel`, `createErrorLabel`). It works with a static list and with `onSearch`.
