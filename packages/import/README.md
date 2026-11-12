# @thomasfosterau/components-import

A data import mapper: take a table a user has (a CSV, a worksheet, a table in a document) and turn it into records of your app's [Effect Schema](https://effect.website), with every row that does not fit reported field by field and cell by cell. The mapping is a plain, versioned JSON spec, so you can store it and offer it again as a preset.

This is the headless core: the target descriptor, the spec and the mapping engine. The Svelte UI follows as a `./svelte` entry. **Not yet published:** the package is `private` until the effect-document adapter and the UI land ([#139](https://github.com/thomasfosterau/components/issues/139)).

## Install

```sh
pnpm add @thomasfosterau/components-import effect
```

The package is ESM-only. `effect` (`^4.0.0`) is a required peer.

## Example

```ts
import { applyMapping, importTarget, sourceTableFromGrid } from '@thomasfosterau/components-import';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';

const Contact = Schema.Struct({
  name: Schema.String.annotate({ title: 'Full name', importAliases: ['contact'] }),
  tier: Schema.Literals(['free', 'pro']),
});

const program = Effect.gen(function* () {
  const target = yield* importTarget(Contact);
  const table = sourceTableFromGrid(
    [
      ['Name', 'Plan'],
      ['Ada', 'pro'],
    ],
    { headerRow: 0, skipRows: 0 },
  );
  const spec = {
    version: 1,
    source: { format: 'csv', readerOptions: {}, table: [0], headerRow: 0, skipRows: 0 },
    fields: {
      name: { kind: 'column', column: { header: 'Name' }, parse: { trimWhitespace: true } },
      tier: { kind: 'column', column: { header: 'Plan' } },
    },
    fingerprint: { format: 'csv', headers: ['name', 'plan'] },
  } as const;
  return yield* Stream.runCollect(applyMapping(target, spec, table));
  // [{ row: 1, result: Result.succeed({ name: 'Ada', tier: 'pro' }) }]
});
```

## Entry points

| Entry | What | Peer to install |
| --- | --- | --- |
| `@thomasfosterau/components-import` | `importTarget` and its JSON descriptor, the `ImportSpec` Schema and `decodeImportSpec`, `applyMapping`, `sourceTableFromGrid` | `effect` |

## Docs

- API reference: the TSDoc on each export, which your editor shows on hover and which ships in the published `.d.ts`.
- Design and roadmap: [issue #139](https://github.com/thomasfosterau/components/issues/139).
- Contributing: the [root README](https://github.com/thomasfosterau/components/blob/trunk/README.md) and [AGENTS.md](https://github.com/thomasfosterau/components/blob/trunk/packages/import/AGENTS.md).

## License

MIT © Thomas Foster
