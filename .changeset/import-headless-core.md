---
'@thomasfosterau/components-import': minor
---

New package: the headless core of the data import mapper (#139). `importTarget(schema)` compiles an Effect `Schema.Struct` into an import target with a JSON field descriptor (key, title, description, kind, whether it is required, enum members, `importAliases`), failing with `UnsupportedFieldType` on a field no single cell can fill. `ImportSpec` is the version-1 mapping spec as an Effect Schema, with every mapping kind, decoded strictly by `decodeImportSpec`. `applyMapping` streams a table's rows through the target's Schema for `column`, `constant` and `skip` mappings (with `trimWhitespace` and `nullValues`), applying cell edits first and reporting each issue with its field and source cell; any other mapping kind fails with `UnsupportedMapping`. `effect` is a required peer.
