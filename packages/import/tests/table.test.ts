import { assert, describe, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import { sourceTableFromGrid } from '../src/index.ts';

const grid = [
  ['Exported 2026-11-12', undefined],
  ['Name', DateTime.toDateUtc(DateTime.makeUnsafe('2026-01-01T00:00:00.000Z'))],
  ['units', 'kg'],
  ['Ada', 3],
];

describe('sourceTableFromGrid', () => {
  it('skips rows, takes the header and keeps each row its grid position', () => {
    const table = sourceTableFromGrid(grid, { headerRow: 0, skipRows: 1 });
    assert.deepStrictEqual(table.headers, ['Name', '2026-01-01T00:00:00.000Z']);
    assert.deepStrictEqual(
      table.rows.map((row) => row.index),
      [2, 3],
    );
  });

  it('drops the rows between the skipped ones and the header', () => {
    const table = sourceTableFromGrid(grid, { headerRow: 1, skipRows: 1 });
    assert.deepStrictEqual(table.headers, ['units', 'kg']);
    assert.deepStrictEqual(table.rows, [{ index: 3, cells: ['Ada', 3] }]);
  });

  it('reads every kept row as data without a header row', () => {
    const table = sourceTableFromGrid(grid, { skipRows: 2 });
    assert.deepStrictEqual(table.headers, []);
    assert.deepStrictEqual(
      table.rows.map((row) => row.index),
      [2, 3],
    );
  });

  it('reads an empty header cell as an empty name', () => {
    const table = sourceTableFromGrid(grid, { headerRow: 0, skipRows: 0 });
    assert.deepStrictEqual(table.headers, ['Exported 2026-11-12', '']);
  });
});
