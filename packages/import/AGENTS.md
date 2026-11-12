# @thomasfosterau/components-import

The data import mapper of #139: an app hands it a target `Schema.Struct` and a user's table, and gets typed records back, row by row, with every issue tied to a field and a source cell. This package is its headless core (the `.` entry); the UI is a later `./svelte` entry. Repo-wide rules are in the root [AGENTS.md](../../AGENTS.md); the entry is in [README.md](README.md); the API reference is the TSDoc on each export. The issue is the spec, its later comments overriding the body.

## Where it differs from the other packages

It has packages/charts' shape (see [its AGENTS.md](../charts/AGENTS.md)): plain TypeScript built with `vp pack`, `check` as the Effect-patched native `tsc` twice (`tsconfig.json`, then `tsconfig.pure.json` over `src` with no DOM lib and no ambient types), and a Node suite. What it does not take from charts, and why:

- **Effect is the public API, not an implementation detail.** `importTarget` returns an `Effect`, `applyMapping` a `Stream`, the spec and descriptor are Effect Schemas and the errors are `Schema.TaggedError`s. So `effect` is a required peer (`catalog:peers`, `^4.0.0`) rather than a dependency, and there is no `check-dist-types` script: the published `.d.mts` names `effect` on purpose. `@thomasfosterau/effect-document` is the other (`catalog:peers`, `^0.2.0`), for the same reason: `sourceTableFromRegion` and `findRegion` take the app's own `TableRegion`s and `Document`s, and `TableLocator` is its type. The code is developed on the workspace pin and written to run on 4.0.0.
- **The whole of `src` and `tests` is Effect code** (`effectFiles` in the root `vite.config.ts`), so every Effect lint rule applies to the suite too.
- **Private until it is usable.** `package.json` says `"private": true` and the package carries no changeset, so a Release run never tries to publish a package npm has no trusted publisher for. The effect-document adapter has landed; the PR that completes the usable surface with the UI removes `private`, adds the changeset, and flags the owner's one-time npm bootstrap ([PUBLISHING.md](../../PUBLISHING.md) §3).
- **No Svelte yet.** `./svelte` arrives in slice 3, as `svelte-package` output after `vp pack` (charts' `/svelte` is the model), consuming this core through its published entry.

## Boundary

- **The `.` entry is headless.** No Svelte, no DOM, no Node: `fallow-rules.json`'s `import-core-independent` bans `svelte`, `$app`, `$env` and the other workspace packages from `src`, and `tsconfig.pure.json` fails `check` on any DOM or `node:` reference. An app server imports the same module to re-decode, and the engine can move into a Web Worker later: its inputs (`ImportSpec`, `SourceTable`, `CellEdit`s) are plain data.
- **Callbacks that cross into the UI follow the repo convention** (`(…, signal: AbortSignal) => Promise<T>`) once the UI lands, so an app's UI code never touches Effect; the Effect surface is for the app's own Effect code and its server.
- **Documents come from `@thomasfosterau/effect-document`, through `/schema` only.** `src/region.ts` is the adapter: `sourceTableFromRegion` reduces a `candidateTables` region (a `WorksheetRegion` or a `ProseTableRegion`) to the neutral `SourceTable` through the same header/skip reading as `sourceTableFromGrid` (`sourceTableFromRows` in `src/table.ts`), `regionRead` is the region's own header guess, and `findRegion` finds the region a spec's `source.table` names. `TableLocator` is upstream's type; the Schema here decodes a stored one, and `tests/spec.test.ts` pins the two mutually assignable. `src` imports no reader subpath, so effect-document's optional peer `@thomasfosterau/effect-parse` (the `/csv`, `/rtf`, `/ooxml*` and `/iwork*` grammars) is not ours: an app takes it on when it imports a reader. It is a devDependency here because the suite reads CSV through `/csv`. `fallow-rules.json`'s `effect-document-only-in-import` keeps effect-document out of every other package.
- **How a worksheet cell maps** (`src/region.ts` says it on `sheetCellValue`): to the value a CSV export of the sheet would carry, so a workbook and its CSV map alike. Text, number and boolean their value, a date its `Date`, a formula its cached result (none without one), rich text its plain text, an error its literal (`#DIV/0!`, which `parse.nullValues` can empty), a blank or a gap no value. A row the sheet does not hold is no row, and a row's `index` is the sheet's row index. A prose table's covered (merged-over) positions are no value; a header position under a merged cell, in either kind, takes that cell's text.
- **`sideEffects: false` holds**: every module only declares. The transform registry (slice 5) will be a value the app constructs, never a module-level map.

## Invariants

- **`ImportSpec` version 1 is fixed.** It already carries every `FieldMapping` kind and every `ParseOptions` field, so a stored preset decodes the same before and after the engine learns them. A change to its shape is a `version` bump with a migration, never an edit. `decodeImportSpec` is strict (`onExcessProperty: 'error'`, every issue collected).
- **JSON-document types are present-or-absent.** `ImportSpec`, `FieldDescriptor` and `TargetDescriptor` use `Schema.optionalKey`, never `| undefined`, as packages/charts' spec types do; the code builds the descriptor with `Option` (`Schema.OptionFromOptionalKey`) and encodes it.
- **An unsupported kind is an error, never a skip.** `importTarget` fails with `UnsupportedFieldType` on a field no single cell can fill; `applyMapping` fails with `UnsupportedMapping` on a mapping kind it does not apply yet, before any row.
- **Rows decode through the target's own Schema**, as `Schema.toCodecStringTree(target.schema)`: every cell goes in as its canonical text (a `Date` as ISO 8601), so typed worksheet cells and prose-table text decode alike and the target's checks run unchanged. A row's `index` is its position in the whole table, so edits and issues survive a change to `skipRows` or `headerRow`.

## Plan

1. The scaffold (done): `importTarget` and its descriptor, the `ImportSpec` Schema, and `applyMapping` for `column`, `constant` and `skip`, with `trimWhitespace` and `nullValues`.
2. effect-document 0.2.0: the required peer, upstream's `TableLocator`, and the region adapter (done).
3. Next: `./svelte`, `ImportMapper` steps 1, 3 and 5 for CSV (slice 3), then read options (slice 4). The PR that makes it usable removes `private` and adds the changeset.
4. Slice 5: the other mapping kinds, the other `ParseOptions` fields and the transform registry. Slices 6 to 8: review grid, presets and fingerprints, prose-table sources.

## Testing

`vp test run tests` under Node: decoding and mapping, no DOM to drive. Documents are built with effect-document's constructors, or read from text through its `/csv` reader (`tests/region.test.ts`, a preview `maxRows` read included). Tests import `it`, `describe` and `assert` from `@effect/vitest` (`it.effect` for anything that runs Effect, plain `it` for pure helpers), which wraps the workspace's one `vitest`, the copy `vite-plus/test` re-exports; nothing imports `vitest` directly. `tests/` mirrors `src/`.

## Commands

From the workspace root:

```sh
vp run --filter ./packages/import test:unit   # Vitest under Node
vp run --filter ./packages/import check       # tsc, plus the DOM-free re-check of src
vp run --filter ./packages/import build       # vp pack -> dist/
```
