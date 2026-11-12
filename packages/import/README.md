# @thomasfosterau/components-import

A data import mapper: take a table a user has (a CSV, a worksheet, a table in a document) and turn it into records of your app's [Effect Schema](https://effect.website), with every row that does not fit reported field by field and cell by cell. The mapping is a plain, versioned JSON spec, so you can store it and offer it again as a preset.

This is the headless core: the target descriptor, the spec, the mapping engine and the adapter that reads [`@thomasfosterau/effect-document`](https://www.npmjs.com/package/@thomasfosterau/effect-document)'s documents. The Svelte UI follows as a `./svelte` entry. **Not yet published:** the package is `private` until the UI lands ([#139](https://github.com/thomasfosterau/components/issues/139)).

## Install

```sh
pnpm add @thomasfosterau/components-import @thomasfosterau/effect-document effect
```

The package is ESM-only. `effect` (`^4.0.0`) and `@thomasfosterau/effect-document` (`^0.2.0`) are required peers. Only effect-document's `/schema` entry is loaded by this package, so its readers' optional peer `@thomasfosterau/effect-parse` is yours to add when you import a reader such as `/csv` (`pnpm add @thomasfosterau/effect-parse`).

## Example

Read a CSV with effect-document, pick its table, and map it onto your Schema:

```ts
import {
  applyMapping,
  findRegion,
  importTarget,
  sourceTableFromRegion,
  type ImportSpec,
} from '@thomasfosterau/components-import';
import * as Csv from '@thomasfosterau/effect-document/csv';
import { text } from '@thomasfosterau/effect-document/io';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';

const Contact = Schema.Struct({
  name: Schema.String.annotate({ title: 'Full name', importAliases: ['contact'] }),
  tier: Schema.Literals(['free', 'pro']),
});

const spec: ImportSpec = {
  version: 1,
  source: {
    format: 'csv',
    readerOptions: { treatFirstRowAsHeader: true },
    table: [0], // the region's locator, from `candidateTables(doc)`
    headerRow: 0,
    skipRows: 0,
  },
  fields: {
    name: { kind: 'column', column: { header: 'Name' }, parse: { trimWhitespace: true } },
    tier: { kind: 'column', column: { header: 'Plan' } },
  },
  fingerprint: { format: 'csv', headers: ['name', 'plan'] },
};

const program = Effect.gen(function* () {
  const target = yield* importTarget(Contact);
  // Pass `maxRows` too for a bounded preview; `isTruncated(doc)` then says so.
  const doc = yield* Csv.makeCsvReader({ treatFirstRowAsHeader: true }).read(
    text('Name,Plan\nAda,pro\n'),
  );
  const region = yield* Effect.fromOption(findRegion(doc, spec.source.table));
  return yield* Stream.runCollect(
    applyMapping(target, spec, sourceTableFromRegion(region, spec.source)),
  );
  // [{ row: 1, result: Result.succeed({ name: 'Ada', tier: 'pro' }) }]
});
```

`sourceTableFromRegion(region)` with no read options uses the region's own header guess (`regionRead(region)`: a worksheet's first row when it looks like a header, a prose table's last head row), which is what a UI seeds the spec with. A table you built yourself goes through `sourceTableFromGrid(grid, spec.source)` instead.

## Entry points

| Entry | What | Peer to install |
| --- | --- | --- |
| `@thomasfosterau/components-import` | `importTarget` and its JSON descriptor, the `ImportSpec` Schema and `decodeImportSpec`, `applyMapping`, `sourceTableFromRegion`, `regionRead`, `findRegion`, `sourceTableFromGrid` | `effect`, `@thomasfosterau/effect-document` |

## Docs

- API reference: the TSDoc on each export, which your editor shows on hover and which ships in the published `.d.ts`.
- Design and roadmap: [issue #139](https://github.com/thomasfosterau/components/issues/139).
- Contributing: the [root README](https://github.com/thomasfosterau/components/blob/trunk/README.md) and [AGENTS.md](https://github.com/thomasfosterau/components/blob/trunk/packages/import/AGENTS.md).

## License

MIT © Thomas Foster
