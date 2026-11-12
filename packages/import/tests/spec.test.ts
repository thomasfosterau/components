import { assert, describe, it } from '@effect/vitest';
import type * as Document from '@thomasfosterau/effect-document/schema';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { decodeImportSpec, ImportSpec, TableLocator, type FieldMapping } from '../src/index.ts';

/** Mutual assignability in both directions. */
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * Compile-time: what the `TableLocator` Schema decodes is effect-document's
 * `TableLocator`, and so is the exported type. `check` fails on drift.
 */
const locatorParity: [
  Equals<Schema.Schema.Type<typeof TableLocator>, Document.TableLocator>,
  Equals<TableLocator, Document.TableLocator>,
  Equals<ImportSpec['source']['table'], Document.TableLocator>,
] = [true, true, true];

/** One field of every `FieldMapping` kind, so the version-1 format is pinned whole. */
const everyKind = {
  name: {
    kind: 'column',
    column: { header: 'Name', index: 0 },
    parse: {
      trimWhitespace: true,
      nullValues: ['', 'N/A'],
      booleans: ['yes', 'no'],
      booleansCaseSensitive: false,
      decimalChar: ',',
      groupChar: '.',
      percent: true,
      datePatterns: ['DD/MM/YYYY'],
    },
  },
  byIndex: { kind: 'column', column: { index: 3 } },
  source: { kind: 'constant', value: { origin: 'import', tags: ['a', 1, true, null] } },
  label: { kind: 'template', template: '{0} {1}', columns: [{ header: 'First' }, { index: 1 }] },
  first: { kind: 'split', column: { header: 'Name' }, separator: ' ', index: 0 },
  zip: { kind: 'regex', column: { header: 'Address' }, pattern: '(\\d{4})$', group: 1 },
  tier: { kind: 'valueMap', column: { header: 'Plan' }, map: { Gold: 'pro' }, otherwise: 'error' },
  country: {
    kind: 'custom',
    name: 'lookupCountry',
    columns: [{ index: 5 }],
    args: { fallback: 'AU' },
  },
  ignored: { kind: 'skip' },
} satisfies Readonly<Record<string, FieldMapping>>;

const spec = {
  version: 1,
  source: {
    format: 'xlsx',
    encoding: 'utf-8',
    readerOptions: { sheetName: 'People' },
    table: [2, 'body', 0],
    headerRow: 0,
    skipRows: 1,
  },
  fields: everyKind,
  fingerprint: { format: 'xlsx', headers: ['name', 'address', 'plan'] },
} satisfies ImportSpec;

describe('ImportSpec', () => {
  it.effect('round-trips a spec with every mapping kind through JSON', () =>
    Effect.gen(function* () {
      const text = yield* Schema.encodeEffect(Schema.fromJsonString(ImportSpec))(spec);
      const document = yield* Schema.decodeEffect(Schema.fromJsonString(Schema.Json))(text);
      const decoded = yield* decodeImportSpec(document);
      assert.deepStrictEqual(decoded, spec);
    }),
  );

  it.effect('decodes a spec without a header row or encoding', () =>
    Effect.gen(function* () {
      const decoded = yield* decodeImportSpec({
        version: 1,
        source: { format: 'csv', readerOptions: null, table: [], skipRows: 0 },
        fields: {},
        fingerprint: { format: 'csv', headers: [] },
      });
      assert.isUndefined(decoded.source.headerRow);
    }),
  );

  it.effect.each([
    ['an unknown top-level key', { ...spec, extra: true }],
    ['an unknown key in a mapping', { ...spec, fields: { a: { kind: 'skip', why: 'x' } } }],
    ['an unknown mapping kind', { ...spec, fields: { a: { kind: 'lookup' } } }],
    ['a version it does not know', { ...spec, version: 2 }],
    [
      'a column with neither header nor index',
      { ...spec, fields: { a: { kind: 'column', column: {} } } },
    ],
    ['a negative position', { ...spec, fields: { a: { kind: 'column', column: { index: -1 } } } }],
    [
      'a header row that is not a number',
      { ...spec, source: { ...spec.source, headerRow: 'first' } },
    ],
    [
      'an unknown parse option',
      { ...spec, fields: { a: { kind: 'column', column: { index: 0 }, parse: { trim: true } } } },
    ],
  ] as const)('rejects %s', ([, document]) =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(decodeImportSpec(document));
      assert.strictEqual(error._tag, 'SchemaError');
    }),
  );
});

describe('TableLocator', () => {
  it('is effect-document’s locator type (compile-time)', () => {
    assert.deepStrictEqual(locatorParity, [true, true, true]);
  });

  it('decodes a locator effect-document gives', () => {
    const locator: Document.TableLocator = [2, 'body', 0];
    assert.deepStrictEqual(Schema.decodeSync(TableLocator)(locator), locator);
  });
});
