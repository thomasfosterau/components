import { assert, describe, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Stream from 'effect/Stream';
import {
  applyMapping,
  importTarget,
  sourceTableFromGrid,
  UnsupportedMapping,
  type FieldMapping,
  type MappedRow,
  type SourceCell,
} from '../src/index.ts';
import { Contact, specOf } from './fixtures.ts';

const grid: ReadonlyArray<ReadonlyArray<SourceCell>> = [
  ['Name', 'Email', 'Born', 'Plan'],
  ['Ada Lovelace', 'ada@example.com', '1815-12-10', 'pro'],
  ['  Lin  ', 'lin@example.com', '', 'free'],
  ['Nia', 'not-an-email', 'N/A', 'gold'],
];
const table = sourceTableFromGrid(grid, { headerRow: 0, skipRows: 0 });

/** A `Date` at an ISO instant, as a reader hands a date cell over. */
const dateAt = (iso: string): Date => DateTime.toDateUtc(DateTime.makeUnsafe(iso));

const columns = {
  name: { kind: 'column', column: { header: 'Name' }, parse: { trimWhitespace: true } },
  email: { kind: 'column', column: { header: 'Email' } },
  dob: { kind: 'column', column: { header: 'Born' }, parse: { nullValues: ['', 'N/A'] } },
  tier: { kind: 'column', column: { header: 'Plan' } },
} satisfies Readonly<Record<string, FieldMapping>>;

const decodedOf = <A>(rows: ReadonlyArray<MappedRow<A>>) =>
  rows.map(({ row, result }) => [row, Result.getOrUndefined(result)] as const);

const issuesOf = <A>(rows: ReadonlyArray<MappedRow<A>>) =>
  rows.flatMap(({ row, result }) =>
    Result.match(result, {
      onSuccess: () => [],
      onFailure: (issues) =>
        issues.map((issue) => ({
          row,
          field: Option.getOrUndefined(issue.field),
          cell: Option.getOrUndefined(issue.cell),
          message: issue.message,
        })),
    }),
  );

describe('applyMapping', () => {
  it.effect('decodes column mappings, with trimming and empty values', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const rows = yield* Stream.runCollect(applyMapping(target, specOf(columns), table));
      assert.deepStrictEqual(decodedOf(rows), [
        [
          1,
          {
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            dob: dateAt('1815-12-10'),
            tier: 'pro',
          },
        ],
        [2, { name: 'Lin', email: 'lin@example.com', tier: 'free' } satisfies Contact],
        [3, undefined],
      ]);
    }),
  );

  it.effect('reports each issue with its field, source cell and message', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const rows = yield* Stream.runCollect(applyMapping(target, specOf(columns), table));
      assert.deepStrictEqual(issuesOf(rows), [
        {
          row: 3,
          field: 'email',
          cell: { row: 3, column: 1 },
          message: 'Expected a string matching the RegExp @',
        },
        { row: 3, field: 'tier', cell: { row: 3, column: 3 }, message: 'Expected "free" | "pro"' },
      ]);
    }),
  );

  it.effect('decodes typed cells and text cells alike', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(
        Schema.Struct({
          count: Schema.Int,
          ratio: Schema.Finite,
          isActive: Schema.Boolean,
          at: Schema.Date,
          label: Schema.String,
        }),
      );
      const at = dateAt('2026-01-02T03:04:05.000Z');
      const typed = sourceTableFromGrid(
        [
          ['count', 'ratio', 'isActive', 'at', 'label'],
          [3, 0.25, true, at, 7],
          ['3', '0.25', 'true', '2026-01-02T03:04:05.000Z', 'seven'],
          ['3.5', 'many', 'yes', 'never', ''],
        ],
        { headerRow: 0, skipRows: 0 },
      );
      const fields = {
        count: { kind: 'column', column: { header: 'count' } },
        ratio: { kind: 'column', column: { header: 'ratio' } },
        isActive: { kind: 'column', column: { header: 'isActive' } },
        at: { kind: 'column', column: { header: 'at' } },
        label: { kind: 'column', column: { header: 'label' } },
      } satisfies Readonly<Record<string, FieldMapping>>;
      const rows = yield* Stream.runCollect(applyMapping(target, specOf(fields), typed));
      assert.deepStrictEqual(decodedOf(rows).slice(0, 2), [
        [1, { count: 3, ratio: 0.25, isActive: true, at, label: '7' }],
        [2, { count: 3, ratio: 0.25, isActive: true, at, label: 'seven' }],
      ]);
      assert.deepStrictEqual(
        issuesOf(rows).map(({ field }) => field),
        ['count', 'ratio', 'isActive', 'at', 'label'],
      );
    }),
  );

  it.effect('fills constants and leaves skipped and unmapped fields empty', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const fields = {
        name: { kind: 'column', column: { header: 'Name' } },
        email: { kind: 'constant', value: 'team@example.com' },
        tier: { kind: 'constant', value: 'free' },
        dob: { kind: 'skip' },
      } satisfies Readonly<Record<string, FieldMapping>>;
      const rows = yield* Stream.runCollect(applyMapping(target, specOf(fields), table));
      assert.deepStrictEqual(decodedOf(rows)[0], [
        1,
        { name: 'Ada Lovelace', email: 'team@example.com', tier: 'free' },
      ]);
      const unmapped = yield* Stream.runCollect(
        applyMapping(target, specOf({ name: fields.name }), table),
      );
      assert.deepStrictEqual(issuesOf(unmapped).slice(0, 2), [
        { row: 1, field: 'email', cell: undefined, message: 'Missing key' },
        { row: 1, field: 'tier', cell: undefined, message: 'Missing key' },
      ]);
    }),
  );

  it.effect('gives a numeric or boolean constant to a typed field', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(
        Schema.Struct({ count: Schema.Int, isActive: Schema.Boolean, note: Schema.Unknown }),
      );
      const rows = yield* Stream.runCollect(
        applyMapping(
          target,
          specOf({
            count: { kind: 'constant', value: 2 },
            isActive: { kind: 'constant', value: false },
            note: { kind: 'constant', value: { from: 'import' } },
          }),
          table,
        ),
      );
      assert.deepStrictEqual(decodedOf(rows)[0], [
        1,
        { count: 2, isActive: false, note: { from: 'import' } },
      ]);
    }),
  );

  it.effect('applies edits to the source cells before mapping', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const rows = yield* Stream.runCollect(
        applyMapping(target, specOf(columns), table, {
          edits: [
            { row: 3, column: 1, value: 'nia@example.com' },
            { row: 3, column: 3, value: 'gold' },
            { row: 3, column: 3, value: 'pro' },
            { row: 1, column: 2, value: undefined },
          ],
        }),
      );
      assert.deepStrictEqual(decodedOf(rows), [
        [1, { name: 'Ada Lovelace', email: 'ada@example.com', tier: 'pro' }],
        [2, { name: 'Lin', email: 'lin@example.com', tier: 'free' }],
        [3, { name: 'Nia', email: 'nia@example.com', tier: 'pro' }],
      ]);
    }),
  );

  it.effect('finds a column by header, case and spacing aside, or by position', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Schema.Struct({ a: Schema.String, b: Schema.String }));
      const reordered = sourceTableFromGrid(
        [
          ['  B ', 'A', 'A'],
          ['b0', 'a1', 'a2'],
        ],
        { headerRow: 0, skipRows: 0 },
      );
      const byHeader = yield* Stream.runCollect(
        applyMapping(
          target,
          specOf({
            a: { kind: 'column', column: { header: 'A', index: 2 } },
            b: { kind: 'column', column: { header: 'b' } },
          }),
          reordered,
        ),
      );
      assert.deepStrictEqual(decodedOf(byHeader), [[1, { a: 'a2', b: 'b0' }]]);
      const headless = sourceTableFromGrid([['x', 'y']], { skipRows: 0 });
      const byIndex = yield* Stream.runCollect(
        applyMapping(
          target,
          specOf({
            a: { kind: 'column', column: { header: 'A', index: 1 } },
            b: { kind: 'column', column: { index: 0 } },
          }),
          headless,
        ),
      );
      assert.deepStrictEqual(decodedOf(byIndex), [[0, { a: 'y', b: 'x' }]]);
    }),
  );

  it.effect('fails before any row on a column the table does not have', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const error = yield* Effect.flip(
        Stream.runCollect(
          applyMapping(
            target,
            specOf({ ...columns, email: { kind: 'column', column: { header: 'Mail', index: 9 } } }),
            table,
          ),
        ),
      );
      assert.strictEqual(error._tag, 'ColumnNotFound');
      assert.include(error.message, '"email"');
    }),
  );

  it.effect('fails on a field the target does not have', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const error = yield* Effect.flip(
        Stream.runCollect(
          applyMapping(target, specOf({ ...columns, phone: { kind: 'skip' } }), table),
        ),
      );
      assert.strictEqual(error._tag, 'UnknownTargetField');
      assert.include(error.message, '"phone"');
    }),
  );

  it.effect.each([
    { kind: 'template', template: '{0}', columns: [{ index: 0 }] },
    { kind: 'split', column: { index: 0 }, separator: ' ', index: 0 },
    { kind: 'regex', column: { index: 0 }, pattern: '(.*)', group: 1 },
    { kind: 'valueMap', column: { index: 0 }, map: {} },
    { kind: 'custom', name: 'lookup', columns: [] },
  ] satisfies ReadonlyArray<FieldMapping>)(
    'fails as not yet supported on a $kind mapping',
    (mapping) =>
      Effect.gen(function* () {
        const target = yield* importTarget(Contact);
        const error = yield* Effect.flip(
          Stream.runCollect(applyMapping(target, specOf({ ...columns, name: mapping }), table)),
        );
        assert.deepStrictEqual(
          error,
          new UnsupportedMapping({
            field: 'name',
            kind: mapping.kind,
            message: `The field "name" uses a "${mapping.kind}" mapping, which this version does not apply yet.`,
          }),
        );
      }),
  );
});
