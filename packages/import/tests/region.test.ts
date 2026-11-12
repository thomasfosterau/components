import { assert, describe, it } from '@effect/vitest';
import * as Csv from '@thomasfosterau/effect-document/csv';
import { isTruncated, text } from '@thomasfosterau/effect-document/io';
import {
  candidateTables,
  cell,
  document,
  MergeRange,
  plainText,
  sparseRow,
  str,
  strong,
  Table,
  TableCell,
  TableRow,
  withSheetLayout,
  worksheetFromRows,
} from '@thomasfosterau/effect-document/schema';
import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Stream from 'effect/Stream';
import {
  applyMapping,
  findRegion,
  importTarget,
  regionRead,
  sourceTableFromRegion,
  type FieldMapping,
  type ImportSpec,
} from '../src/index.ts';
import { Contact } from './fixtures.ts';

const born = DateTime.toDateUtc(DateTime.makeUnsafe('1815-12-10T00:00:00.000Z'));

/** A sheet with every kind of cell, a gap, a row the sheet does not hold, and a merged header. */
const sheet = withSheetLayout(
  worksheetFromRows('Contacts', [
    [cell.text('Name'), cell.text('Born'), cell.text('Score'), cell.text('Phone')],
    [
      cell.richText([strong([str('Ada')]), str(' Lovelace')]),
      cell.date(born),
      cell.formula('B2*2', '42'),
      true,
      '555-0100',
    ],
    sparseRow(3, [
      [0, 'Lin'],
      [2, cell.error('#DIV/0!')],
      [3, cell.formula('A1')],
      [4, cell.blank()],
    ]),
  ]),
  [],
  [new MergeRange({ fromRow: 0, fromCol: 3, toRow: 0, toCol: 4 })],
);

/** A prose table: two head rows (the first merged across two columns), and a body cell merged down. */
const prose = new Table({
  colSpecs: [],
  foot: [],
  head: [
    new TableRow({
      cells: [
        new TableCell({ rowSpan: 2, content: [plainText('Plan')] }),
        new TableCell({ colSpan: 2, content: [plainText('Contact')] }),
      ],
    }),
    new TableRow({
      cells: [
        new TableCell({ content: [plainText('Name')] }),
        new TableCell({ content: [plainText('Email')] }),
      ],
    }),
  ],
  body: [
    new TableRow({
      cells: [
        new TableCell({ rowSpan: 2, content: [plainText('pro')] }),
        new TableCell({ content: [plainText('Ada')] }),
        new TableCell({ content: [plainText('ada@example.com')] }),
      ],
    }),
    new TableRow({
      cells: [
        new TableCell({ content: [plainText('Lin')] }),
        new TableCell({ content: [plainText('')] }),
      ],
    }),
  ],
});

const doc = document([sheet, prose]);
const regions = candidateTables(doc);

describe('sourceTableFromRegion', () => {
  it.effect('maps a worksheet’s typed cells and keeps its row indexes', () =>
    Effect.gen(function* () {
      const region = yield* Effect.fromOption(Arr.get(regions, 0));
      assert.strictEqual(region._tag, 'WorksheetRegion');
      assert.deepStrictEqual(regionRead(region), { headerRow: 0, skipRows: 0 });
      const table = sourceTableFromRegion(region);
      // The merge over D1:E1 names both columns.
      assert.deepStrictEqual(table.headers, ['Name', 'Born', 'Score', 'Phone', 'Phone']);
      // Row 2 is not in the sheet, so it is no row; row 3 keeps its index.
      assert.deepStrictEqual(table.rows, [
        { index: 1, cells: ['Ada Lovelace', born, '42', true, '555-0100'] },
        { index: 3, cells: ['Lin', undefined, '#DIV/0!', undefined, undefined] },
      ]);
    }),
  );

  it.effect('reads a worksheet as the spec says, over its own guess', () =>
    Effect.gen(function* () {
      const table = sourceTableFromRegion(yield* Effect.fromOption(Arr.get(regions, 0)), {
        skipRows: 1,
      });
      assert.deepStrictEqual(table.headers, []);
      assert.deepStrictEqual(
        table.rows.map((row) => row.index),
        [1, 3],
      );
    }),
  );

  it.effect('reads a prose table under its last head row, merged cells covered', () =>
    Effect.gen(function* () {
      const region = yield* Effect.fromOption(Arr.get(regions, 1));
      assert.strictEqual(region._tag, 'ProseTableRegion');
      assert.deepStrictEqual(regionRead(region), { headerRow: 1, skipRows: 0 });
      const table = sourceTableFromRegion(region);
      // "Plan" spans both head rows, so the header row's first column takes it.
      assert.deepStrictEqual(table.headers, ['Plan', 'Name', 'Email']);
      assert.deepStrictEqual(table.rows, [
        { index: 2, cells: ['pro', 'Ada', 'ada@example.com'] },
        { index: 3, cells: [undefined, 'Lin', ''] },
      ]);
    }),
  );

  it.effect('lets the spec pick another header row of a prose table', () =>
    Effect.gen(function* () {
      const table = sourceTableFromRegion(yield* Effect.fromOption(Arr.get(regions, 1)), {
        headerRow: 0,
        skipRows: 0,
      });
      assert.deepStrictEqual(table.headers, ['Plan', 'Contact', 'Contact']);
      assert.deepStrictEqual(
        table.rows.map((row) => row.index),
        [1, 2, 3],
      );
    }),
  );
});

describe('findRegion', () => {
  it.effect('finds the region at a locator', () =>
    Effect.gen(function* () {
      const region = yield* Effect.fromOption(Arr.get(regions, 1));
      assert.deepStrictEqual(findRegion(doc, [...region.locator]), Option.some(region));
    }),
  );

  it('finds none where the document has no table', () => {
    assert.isTrue(Option.isNone(findRegion(doc, [7])));
    assert.isTrue(Option.isNone(findRegion(doc, [])));
  });
});

const csv = [
  'Name,Email,Born,Plan',
  'Ada Lovelace,ada@example.com,1815-12-10,pro',
  'Lin,lin@example.com,,free',
  'Nia,not-an-email,,gold',
].join('\n');

const fields = {
  name: { kind: 'column', column: { header: 'Name' } },
  email: { kind: 'column', column: { header: 'Email' } },
  dob: { kind: 'column', column: { header: 'Born' } },
  tier: { kind: 'column', column: { header: 'Plan' } },
} satisfies Readonly<Record<string, FieldMapping>>;

/** Reads `csv` with the reader options, maps its one table and collects the rows. */
const importCsv = (preview: Csv.CsvReaderOptions) =>
  Effect.gen(function* () {
    const read = yield* Csv.makeCsvReader({ treatFirstRowAsHeader: true, ...preview }).read(
      text(csv),
    );
    const region = yield* Effect.fromOption(Arr.get(candidateTables(read), 0));
    // Every column is text, so `candidateTables` guesses no header; the
    // reader was told there is one, and the spec says so.
    assert.deepStrictEqual(regionRead(region), { skipRows: 0 });
    const spec: ImportSpec = {
      version: 1,
      source: {
        format: 'csv',
        readerOptions: { treatFirstRowAsHeader: true, ...preview },
        table: region.locator,
        headerRow: 0,
        skipRows: 0,
      },
      fields,
      fingerprint: { format: 'csv', headers: ['name', 'email', 'born', 'plan'] },
    };
    const found = yield* Effect.fromOption(findRegion(read, spec.source.table));
    const target = yield* importTarget(Contact);
    const rows = yield* Stream.runCollect(
      applyMapping(target, spec, sourceTableFromRegion(found, spec.source)),
    );
    return { truncated: isTruncated(read), rows };
  });

describe('a CSV read through effect-document', () => {
  it.effect('maps every row end to end', () =>
    Effect.gen(function* () {
      const { truncated, rows } = yield* importCsv({});
      assert.isFalse(truncated);
      assert.deepStrictEqual(
        rows.map(({ row, result }) => [row, Result.isSuccess(result)]),
        [
          [1, true],
          [2, true],
          [3, false],
        ],
      );
      assert.deepStrictEqual(Result.getOrUndefined(Arr.getUnsafe(rows, 0).result), {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        dob: born,
        tier: 'pro',
      });
    }),
  );

  it.effect('maps a bounded preview read, which says it is one', () =>
    Effect.gen(function* () {
      const { truncated, rows } = yield* importCsv({ maxRows: 2 });
      assert.isTrue(truncated);
      assert.deepStrictEqual(
        rows.map(({ row }) => row),
        [1],
      );
    }),
  );
});
