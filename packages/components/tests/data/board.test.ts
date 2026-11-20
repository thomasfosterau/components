import { expect, test } from 'vite-plus/test';
import {
  defaultBoardCount,
  hasRoom,
  isOverLimit,
  locate,
  moveCard,
  type BoardColumn,
} from '../../src/lib/data/board.ts';

const columns: BoardColumn<string>[] = [
  { id: 'a', title: 'A', cards: ['1', '2', '3'] },
  { id: 'b', title: 'B', cards: ['4'], limit: 2 },
];
const key = (card: string): string => card;

test('locate finds a card by key', () => {
  expect(locate(columns, key, '4')).toEqual({ column: 1, index: 0 });
  expect(locate(columns, key, 'x')).toBeUndefined();
});

test('moveCard moves within a column', () => {
  expect(moveCard(columns, { column: 0, index: 0 }, { column: 0, index: 2 })[0]?.cards).toEqual([
    '2',
    '3',
    '1',
  ]);
});

test('moveCard moves across columns, clamping the index, and leaves the input alone', () => {
  const next = moveCard(columns, { column: 0, index: 1 }, { column: 1, index: 9 });
  expect(next.map((column) => column.cards)).toEqual([
    ['1', '3'],
    ['4', '2'],
  ]);
  expect(columns[0]?.cards).toEqual(['1', '2', '3']);
});

test('moveCard rejects places off the board', () => {
  expect(() => moveCard(columns, { column: 5, index: 0 }, { column: 0, index: 0 })).toThrow(
    RangeError,
  );
  expect(() => moveCard(columns, { column: 1, index: 3 }, { column: 0, index: 0 })).toThrow(
    RangeError,
  );
});

test('limits', () => {
  expect(hasRoom(columns[1] ?? columns[0]!)).toBe(true);
  expect(isOverLimit({ id: 'c', title: 'C', cards: ['1', '2', '3'], limit: 2 })).toBe(true);
  expect(defaultBoardCount(3, undefined)).toBe('3');
  expect(defaultBoardCount(3, 5)).toBe('3 of 5');
});
