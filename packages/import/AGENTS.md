# @thomasfosterau/components-import

The data import mapper: an app hands it a target `Schema.Struct` and a user's table and gets typed records back, row by row, with every issue tied to a field and a source cell. `.` is the headless core; `./svelte` is the UI (`ImportMapper` and its step components). Same shape as `packages/charts`: `vp pack` then `svelte-package` for `./svelte`; `tsc` twice plus `svelte-check`; a Node suite for the core and a Chromium suite (`vite.svelte.config.ts`) for the UI.

## Boundary

- Effect is the public API (`Effect`, `Stream`, Schemas, tagged errors), so `effect` and `@thomasfosterau/effect-document` are required peers. The core, its suite and `src/svelte/session.ts` are linted as Effect code; the code must run on `effect` 4.0.0.
- The `.` entry is headless: no Svelte, DOM or Node (`fallow-rules.json`, `tsconfig.pure.json`), so it can run on a server or in a worker.
- `src/svelte/session.ts` is the UI boundary: each step's Effect work behind a `(…, signal: AbortSignal) => Promise<T>`; the components stay plain Svelte with `T | undefined` props.
- `./svelte` imports the core by package name, never a relative path (`svelte-package` copies `src/svelte` alone), and loads no reader: the app passes the formats it accepts, and for a delimited text format the reader factory (`readerWith`) the read options step builds a reader with. It may import effect-document's `/encoding`, which decodes the text before that reader reads it. `@thomasfosterau/components` is a `workspace:^` peer (and a `workspace:*` dev dependency), so the app's copy and its context are shared, and `check`, `build` and `test:unit` need its `build`.
- Documents come from `@thomasfosterau/effect-document`'s `/schema` only; `src/region.ts` adapts its table regions to `SourceTable`. No reader subpath is imported, so `@thomasfosterau/effect-parse` stays the app's choice (a devDependency here, for the CSV suites).
- A worksheet cell maps to the value a CSV export would carry (see `sheetCellValue`).

## Invariants

- `ImportSpec` version 1 is fixed: a shape change is a version bump with a migration. Decoding is strict.
- JSON-document types (`ImportSpec`, the descriptors) use present-or-absent keys (`Schema.optionalKey`).
- An unsupported field type or mapping kind is an error, never a skip.
- Rows decode through `Schema.toCodecStringTree(target.schema)`, each cell as canonical text. A row's `index` is its position in the whole table.

## Testing

The core under Node, with `it`, `describe` and `assert` from `@effect/vitest`; the UI in Chromium, pinning each component's ARIA contract. Documents are built with effect-document's constructors or read through its `/csv` reader.
