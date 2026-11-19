import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import {
  columnRef,
  fingerprintOf,
  importTarget,
  sourceTableFromGrid,
  suggestMapping,
} from '../src/index.ts';
import { Contact } from './fixtures.ts';

const tableOf = (headers: ReadonlyArray<string>) =>
  sourceTableFromGrid([headers], { headerRow: 0, skipRows: 0 });

describe('suggestMapping', () => {
  it.effect('matches by key, title, alias and letters, strongest signal first', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const table = tableOf(['Contact', 'E-Mail', 'Date of birth', 'tier', 'Notes']);
      assert.deepStrictEqual(suggestMapping(target, table), [
        {
          field: 'name',
          column: { header: 'Contact', index: 0 },
          signal: 'alias',
          confidence: 0.8,
        },
        {
          field: 'email',
          column: { header: 'E-Mail', index: 1 },
          signal: 'fuzzy',
          confidence: 0.6,
        },
        {
          field: 'dob',
          column: { header: 'Date of birth', index: 2 },
          signal: 'title',
          confidence: 0.95,
        },
        { field: 'tier', column: { header: 'tier', index: 3 }, signal: 'key', confidence: 1 },
      ]);
    }),
  );

  it.effect('prefers the stronger signal over the leftmost column', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const [name] = suggestMapping(target, tableOf(['full  name', 'Full name']));
      assert.deepStrictEqual(name?.column, { header: 'Full name', index: 1 });
      assert.strictEqual(name?.signal, 'title');
    }),
  );

  it.effect('lets one column feed several fields', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(
        Schema.Struct({
          email: Schema.String,
          login: Schema.String.annotate({ importAliases: ['email'] }),
        }),
      );
      const fields = suggestMapping(target, tableOf(['email'])).map((s) => s.field);
      assert.deepStrictEqual(fields, ['email', 'login']);
    }),
  );

  it.effect('suggests nothing for a table without a header row', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const table = sourceTableFromGrid([['Ada', 'ada@example.com']], { skipRows: 0 });
      assert.deepStrictEqual(suggestMapping(target, table), []);
    }),
  );
});

describe('columnRef', () => {
  it('names a column by header, or by position when it has none', () => {
    const table = tableOf(['Name', '']);
    assert.deepStrictEqual(columnRef(table, 0), { header: 'Name', index: 0 });
    assert.deepStrictEqual(columnRef(table, 1), { index: 1 });
    assert.deepStrictEqual(columnRef(table, 5), { index: 5 });
  });
});

describe('fingerprintOf', () => {
  it('normalises the header names', () => {
    assert.deepStrictEqual(fingerprintOf('csv', tableOf([' Full  Name ', 'EMAIL'])), {
      format: 'csv',
      headers: ['full name', 'email'],
    });
  });
});
