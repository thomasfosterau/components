---
'@thomasfosterau/components': minor
---

`EntityForm` renders a `text` entry over a boolean-kind field as a No / Yes `Select` posting `"false"` / `"true"`, so apps no longer need a `BooleanSelectField` widget. The option text comes from the new `trueLabel` / `falseLabel` props (`'Yes'` / `'No'`), or per field from `fieldProps[key]`.
