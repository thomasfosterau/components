import { describe, expect, test } from 'vite-plus/test';
import {
  hiddenIndexes,
  triggerSlot,
  type FitItem,
  type FitRoom,
} from '../../src/lib/ui/overflow.ts';

const eight = (overrides: Partial<Record<number, Partial<FitItem>>> = {}): FitItem[] =>
  Array.from({ length: 8 }, (_, index) => ({
    width: 80,
    priority: 0,
    pinned: false,
    ...overrides[index],
  }));

const room = (available: number, more: Partial<FitRoom> = {}): FitRoom => ({
  available,
  moreWidth: 60,
  gap: 0,
  collapseFrom: 'end',
  minVisible: 1,
  ...more,
});

const sorted = (set: ReadonlySet<number>): number[] => [...set].toSorted((a, b) => a - b);

describe('hiddenIndexes', () => {
  test('hides nothing when everything fits', () => {
    expect(hiddenIndexes(eight(), room(640)).size).toBe(0);
  });

  test('300 px for 8 × 80 px leaves 3 visible beside a 60 px trigger, collapsing from the end', () => {
    expect(sorted(hiddenIndexes(eight(), room(300)))).toEqual([3, 4, 5, 6, 7]);
  });

  test('counts the gaps', () => {
    expect(sorted(hiddenIndexes(eight(), room(330, { gap: 10 })))).toEqual([3, 4, 5, 6, 7]);
  });

  test('collapses from the start', () => {
    expect(sorted(hiddenIndexes(eight(), room(300, { collapseFrom: 'start' })))).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  test('collapses from the middle, keeping the first and last', () => {
    expect(sorted(hiddenIndexes(eight(), room(300, { collapseFrom: 'middle' })))).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(sorted(hiddenIndexes(eight(), room(460, { collapseFrom: 'middle' })))).toEqual([
      2, 3, 4,
    ]);
  });

  test('a high-priority item at the end outlasts lower ones', () => {
    expect(sorted(hiddenIndexes(eight({ 7: { priority: 1 } }), room(300)))).toEqual([
      2, 3, 4, 5, 6,
    ]);
  });

  test('a pinned item never hides, even below minVisible', () => {
    expect(sorted(hiddenIndexes(eight({ 5: { pinned: true } }), room(100)))).toEqual([
      0, 1, 2, 3, 4, 6, 7,
    ]);
  });

  test('stops at minVisible', () => {
    expect(hiddenIndexes(eight(), room(10, { minVisible: 3 })).size).toBe(5);
  });
});

describe('triggerSlot', () => {
  test('is the end for end, the start for start, and the first hidden index for middle', () => {
    const hidden = new Set([2, 3, 4]);
    expect(triggerSlot(hidden, 8, 'end')).toBe(8);
    expect(triggerSlot(hidden, 8, 'start')).toBe(0);
    expect(triggerSlot(hidden, 8, 'middle')).toBe(2);
    expect(triggerSlot(new Set(), 8, 'middle')).toBe(8);
  });
});
