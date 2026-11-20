# @thomasfosterau/components-import

## 0.1.0

### Minor Changes

- 1aa2c67: First release of the data import mapper (#139). The `.` entry is the headless core: `importTarget` and its JSON descriptor, the versioned `ImportSpec` Schema, `applyMapping` (the `column`, `constant` and `skip` mappings), the effect-document adapter (`sourceTableFromRegion`, `regionRead`, `findRegion`), and new in this release `suggestMapping` (a column for each field by key, title, alias or a fuzzy match) and `fingerprintOf`. The new `./svelte` entry is the UI: `ImportMapper`, which takes a user from a CSV or TSV file to the target's records in three steps, and its steps `ImportSource`, `ImportFieldMap` and `ImportSubmit`, with `invalidRows` (`'block'`, `'exclude'` or `'allow'`) deciding what rows the Schema rejects do.

### Patch Changes

- Updated dependencies [dfaf918]
- Updated dependencies [a8e4098]
- Updated dependencies [89ba5de]
- Updated dependencies [72bf89d]
- Updated dependencies [2690757]
- Updated dependencies [532a1e8]
- Updated dependencies [330879b]
- Updated dependencies [c58b512]
- Updated dependencies [e3ab0d1]
- Updated dependencies [26046a3]
- Updated dependencies [f335320]
- Updated dependencies [9c1a899]
  - @thomasfosterau/components@0.5.0
