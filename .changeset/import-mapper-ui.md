---
'@thomasfosterau/components-import': minor
---

First release of the data import mapper (#139). The `.` entry is the headless core: `importTarget` and its JSON descriptor, the versioned `ImportSpec` Schema, `applyMapping` (the `column`, `constant` and `skip` mappings), the effect-document adapter (`sourceTableFromRegion`, `regionRead`, `findRegion`), and new in this release `suggestMapping` (a column for each field by key, title, alias or a fuzzy match) and `fingerprintOf`. The new `./svelte` entry is the UI: `ImportMapper`, which takes a user from a CSV or TSV file to the target's records in three steps, and its steps `ImportSource`, `ImportFieldMap` and `ImportSubmit`, with `invalidRows` (`'block'`, `'exclude'` or `'allow'`) deciding what rows the Schema rejects do.
