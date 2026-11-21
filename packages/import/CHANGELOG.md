# @thomasfosterau/components-import

## 0.1.1

### Patch Changes

- Updated dependencies [60670af]
- Updated dependencies [f1a2f2a]
- Updated dependencies [d4fe23c]
- Updated dependencies [6cd7761]
- Updated dependencies [9c8af3a]
- Updated dependencies [a6ad4a8]
- Updated dependencies [ae9b7d7]
- Updated dependencies [2e354e6]
- Updated dependencies [59f1c28]
- Updated dependencies [3271f8f]
- Updated dependencies [f8aa21b]
- Updated dependencies [d3c1666]
- Updated dependencies [fdcbd27]
- Updated dependencies [0a82fb5]
- Updated dependencies [b50db11]
- Updated dependencies [dd5319f]
- Updated dependencies [a51fdeb]
- Updated dependencies [b2e8ee9]
- Updated dependencies [684d819]
- Updated dependencies [d01e05d]
- Updated dependencies [39364aa]
- Updated dependencies [ea3cdab]
- Updated dependencies [f824a20]
- Updated dependencies [2c817b2]
- Updated dependencies [e222d5a]
- Updated dependencies [f32fec3]
- Updated dependencies [342cd03]
- Updated dependencies [34c468a]
- Updated dependencies [3b92866]
- Updated dependencies [9a6b27d]
- Updated dependencies [4c70d14]
- Updated dependencies [49b5920]
- Updated dependencies [2969546]
- Updated dependencies [b2eb1fa]
- Updated dependencies [30844df]
- Updated dependencies [e421d3c]
- Updated dependencies [c62be79]
- Updated dependencies [00db84b]
- Updated dependencies [0e8b534]
- Updated dependencies [13c721d]
- Updated dependencies [4624c8c]
- Updated dependencies [ce73d7c]
- Updated dependencies [a5ba176]
- Updated dependencies [e6c8bf1]
- Updated dependencies [3ec1235]
- Updated dependencies [0c8f554]
- Updated dependencies [c86fc94]
- Updated dependencies [d92e77e]
- Updated dependencies [66faf09]
- Updated dependencies [eea1462]
- Updated dependencies [cf78de2]
- Updated dependencies [1a298e1]
- Updated dependencies [dda5946]
- Updated dependencies [d60320a]
- Updated dependencies [ccf4b05]
  - @thomasfosterau/components@0.6.0

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
