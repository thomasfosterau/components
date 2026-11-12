/**
 * The arithmetic `SortableList` is built on, tested without the component.
 */

import { expect, test } from 'vite-plus/test';
import {
  defaultSortableAnnouncements,
  edgeScroll,
  move,
  slotAt,
} from '../../src/lib/data/sortable.ts';

test('move returns a reordered copy and leaves its input alone', () => {
  const items = ['a', 'b', 'c', 'd'];
  expect(move(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  expect(move(items, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  expect(move(items, 1, 1)).toEqual(items);
  expect(move(items, 1, 1)).not.toBe(items);
  expect(items).toEqual(['a', 'b', 'c', 'd']);
});

test('move clamps the target into the list', () => {
  expect(move(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
  expect(move(['a', 'b', 'c'], 0, Infinity)).toEqual(['b', 'c', 'a']);
  expect(move(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b']);
  expect(move(['a', 'b', 'c'], 1, Number.NaN)).toEqual(['a', 'b', 'c']);
});

test('move keeps an entry that is itself undefined', () => {
  expect(move([undefined, 1, 2], 0, 2)).toEqual([1, 2, undefined]);
});

test('move throws on a source index outside the list', () => {
  expect(() => move(['a'], 1, 0)).toThrow(RangeError);
  expect(() => move(['a'], -1, 0)).toThrow(RangeError);
  expect(() => move(['a', 'b'], 0.5, 0)).toThrow(RangeError);
  expect(() => move([], 0, 0)).toThrow(RangeError);
});

test('slotAt counts the centres the pointer has passed, mirrored when reversed', () => {
  const centres = [20, 60, 100];
  expect(slotAt(centres, 0)).toBe(0);
  expect(slotAt(centres, 61)).toBe(2);
  expect(slotAt(centres, 500)).toBe(3);
  expect(slotAt(centres, 61, true)).toBe(1);
  expect(slotAt([], 10)).toBe(0);
});

test('edgeScroll speeds up toward an edge and is still in the middle', () => {
  expect(edgeScroll(300, 0, 600)).toBe(0);
  expect(edgeScroll(20, 0, 600)).toBe(-8);
  expect(edgeScroll(-50, 0, 600)).toBe(-16);
  expect(edgeScroll(590, 0, 600)).toBe(12);
  // A scroller too short for two edge bands never scrolls.
  expect(edgeScroll(5, 0, 60)).toBe(0);
});

test('the default announcements are English sentences with 1-based positions', () => {
  expect(defaultSortableAnnouncements.pickedUp('Bed 4', 2, 6)).toBe(
    'Picked up Bed 4. Position 2 of 6.',
  );
  expect(defaultSortableAnnouncements.moved('Bed 4', 3, 6)).toBe('Bed 4 moved to position 3 of 6.');
  expect(defaultSortableAnnouncements.dropped('Bed 4', 3, 6)).toBe(
    'Bed 4 dropped at position 3 of 6.',
  );
  expect(defaultSortableAnnouncements.cancelled('Bed 4', 2)).toBe(
    'Reorder cancelled. Bed 4 returned to position 2.',
  );
});
