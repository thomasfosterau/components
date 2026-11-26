# @thomasfosterau/components-import

A data import mapper: take a table a user has (a CSV, a worksheet, a table in a document) and turn it into records of your app's [Effect Schema](https://effect.website), with every row that does not fit reported field by field and cell by cell. The mapping is a plain, versioned JSON spec, so you can store it and offer it again as a preset.

The `.` entry is the headless core: the target descriptor, the spec, the mapping engine and the adapter that reads [`@thomasfosterau/effect-document`](https://www.npmjs.com/package/@thomasfosterau/effect-document)'s documents. The `./svelte` entry is the UI: `ImportMapper`, which takes a user from a file to records in four steps (pick the file, check how its table is read, match its columns, import), built on [`@thomasfosterau/components`](https://www.npmjs.com/package/@thomasfosterau/components). It handles CSV, TSV and any sheet of an Excel workbook today; format-specific read options (a CSV's separator, quote and encoding) and a review grid follow.

## Install

```sh
pnpm add @thomasfosterau/components-import @thomasfosterau/components @thomasfosterau/effect-document effect
```

The package is ESM-only. `effect` (`^4.0.0`), `@thomasfosterau/effect-document` (`^0.2.0`) and `@thomasfosterau/components` (the minor released alongside) are required peers, and `svelte` (`^5.40.0`) is one for the `./svelte` entry. This package loads no reader of effect-document's, so its readers' optional peer `@thomasfosterau/effect-parse` is yours to add when you import one such as `/csv` (`pnpm add @thomasfosterau/effect-parse`). The UI's styles are `@thomasfosterau/components`' daisyUI classes; set that package up as its README says.

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

## The UI

```svelte
<script lang="ts">
  import { importTarget } from '@thomasfosterau/components-import';
  import { ImportMapper, type ImportResult } from '@thomasfosterau/components-import/svelte';
  import * as Csv from '@thomasfosterau/effect-document/csv';
  import { Xlsx } from '@thomasfosterau/effect-document/ooxml';
  import * as Effect from 'effect/Effect';
  import * as Schema from 'effect/Schema';

  const Contact = Schema.Struct({
    name: Schema.String.annotate({ title: 'Full name', importAliases: ['contact'] }),
    tier: Schema.Literals(['free', 'pro']).annotate({ title: 'Plan' }),
  });
  const target = Effect.runSync(importTarget(Contact));

  // `records` are `typeof Contact.Type`; post them, and re-decode on the server.
  const save = async (result: ImportResult<typeof Contact.Type>, signal: AbortSignal) => {
    await fetch('/contacts', { method: 'POST', body: JSON.stringify(result.records), signal });
  };
</script>

<ImportMapper
  {target}
  formats={[Csv.format, Csv.tsvFormat, Xlsx.format]}
  onSubmit={save}
  invalidRows="exclude"
/>
```

The formats you pass are the ones the file is detected among, and the only readers loaded; a workbook with several sheets lets the user pick one. The user then checks how the table is read: whether its first row is the header, and how many rows above it to skip (a title, a note), with a live preview of the first rows. The columns are matched to the fields from the headers (a field's key, title or `importAliases`) and the user confirms or changes each one. `invalidRows` decides what rows the Schema rejects do: `'block'` (the default) refuses the import while any remain, `'exclude'` leaves them out, `'allow'` passes them on in `result.invalid`. `result.spec` is the mapping as JSON, to store as a preset or replay on the server. `ImportSource`, `ImportReadOptions`, `ImportFieldMap` and `ImportSubmit` are the steps, for laying the flow out yourself.

## Entry points

| Entry | What | Peer to install |
| --- | --- | --- |
| `@thomasfosterau/components-import` | `importTarget` and its JSON descriptor, the `ImportSpec` Schema and `decodeImportSpec`, `applyMapping`, `suggestMapping`, `fingerprintOf`, `sourceTableFromRegion`, `regionRead`, `findRegion`, `sourceTableFromGrid` | `effect`, `@thomasfosterau/effect-document` |
| `@thomasfosterau/components-import/svelte` | `ImportMapper`, and its steps `ImportSource`, `ImportReadOptions`, `ImportFieldMap` and `ImportSubmit` | `svelte`, and the two above |

## Docs

- API reference: the TSDoc on each export, which your editor shows on hover and which ships in the published `.d.ts`.
- Contributing: the [root README](https://github.com/thomasfosterau/components/blob/trunk/README.md) and [AGENTS.md](https://github.com/thomasfosterau/components/blob/trunk/packages/import/AGENTS.md).

## License

MIT © Thomas Foster
