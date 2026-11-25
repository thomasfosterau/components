---
'@thomasfosterau/components-import': minor
---

`ImportMapper` gains a read options step between choosing the file and matching its columns: `ImportReadOptions`, a new step component, sets whether the table's first row is the header and how many rows above it to skip, with a live preview of the first rows and an announced count of the rows to import. It works for every source, a CSV's table and a workbook's sheet alike; an app that passes `Xlsx.format` from `@thomasfosterau/effect-document/ooxml` can import any sheet of an Excel workbook.

Breaking: the header checkbox moves from `ImportFieldMap` to `ImportReadOptions`, so `ImportFieldMap` no longer takes `headerRowLabel` and its `read` is no longer bindable. `ImportMapper` takes `readOptionsLabel` (the new step's name) and `readOptionsProps`.
