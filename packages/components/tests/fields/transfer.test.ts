import { describe, expect, test } from 'vite-plus/test';
import { canShift, shiftPicked } from '../../src/lib/fields/transfer.ts';

const items = ['a', 'b', 'c', 'd', 'e'];

describe('shiftPicked', () => {
  test('moves one entry each way', () => {
    expect(shiftPicked(items, new Set(['c']), 'up')).toEqual(['a', 'c', 'b', 'd', 'e']);
    expect(shiftPicked(items, new Set(['c']), 'down')).toEqual(['a', 'b', 'd', 'c', 'e']);
  });

  test('moves scattered entries together and leaves the input alone', () => {
    expect(shiftPicked(items, new Set(['b', 'd']), 'up')).toEqual(['b', 'a', 'd', 'c', 'e']);
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  test('a block against the edge stays put while the rest moves', () => {
    expect(shiftPicked(items, new Set(['a', 'b', 'd']), 'up')).toEqual(['a', 'b', 'd', 'c', 'e']);
    expect(shiftPicked(items, new Set(['b', 'e']), 'down')).toEqual(['a', 'c', 'b', 'd', 'e']);
  });
});

describe('canShift', () => {
  test('is false at the edge and with nothing picked', () => {
    expect(canShift(items, new Set(['a']), 'up')).toBe(false);
    expect(canShift(items, new Set(['a']), 'down')).toBe(true);
    expect(canShift(items, new Set(['d', 'e']), 'down')).toBe(false);
    expect(canShift(items, new Set(), 'up')).toBe(false);
  });
});
