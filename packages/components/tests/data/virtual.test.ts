/**
 * The windowing maths, without a DOM: prefix offsets, the binary search, the
 * visible range with overscan, and alignment — for fixed sizes and for a mix
 * of measured rows and estimates.
 */

import { expect, test } from 'vite-plus/test';
import {
  alignedOffset,
  indexAt,
  rowOffsets,
  visibleRange,
  VirtualWindow,
} from '../../src/lib/data/virtual.svelte.ts';

test('fixed sizes: offsets are multiples of the size', () => {
  const offsets = rowOffsets(5, () => 40);
  expect([...offsets]).toEqual([0, 40, 80, 120, 160, 200]);
  expect(indexAt(offsets, 0)).toBe(0);
  expect(indexAt(offsets, 39)).toBe(0);
  expect(indexAt(offsets, 40)).toBe(1);
  expect(indexAt(offsets, 199)).toBe(4);
  // Past either end clamps to the nearest row.
  expect(indexAt(offsets, -50)).toBe(0);
  expect(indexAt(offsets, 10_000)).toBe(4);
});

test('measured sizes: the search finds the row under any offset', () => {
  const sizes = [10, 50, 20, 100, 5];
  const offsets = rowOffsets(sizes.length, (index) => sizes[index] ?? 0);
  expect([...offsets]).toEqual([0, 10, 60, 80, 180, 185]);
  expect(indexAt(offsets, 9)).toBe(0);
  expect(indexAt(offsets, 10)).toBe(1);
  expect(indexAt(offsets, 79)).toBe(2);
  expect(indexAt(offsets, 80)).toBe(3);
  expect(indexAt(offsets, 184)).toBe(4);
});

test('an empty list has one offset and an empty range', () => {
  const offsets = rowOffsets(0, () => 40);
  expect([...offsets]).toEqual([0]);
  expect(indexAt(offsets, 100)).toBe(0);
  expect(visibleRange(offsets, 0, 400, 6)).toEqual({ start: 0, end: 0 });
});

test('the visible range adds overscan at each edge and clamps to the list', () => {
  const offsets = rowOffsets(10_000, () => 48);
  // 0–480 px shows rows 0–9; a row starting exactly at the bottom is not visible.
  expect(visibleRange(offsets, 0, 480, 0)).toEqual({ start: 0, end: 10 });
  expect(visibleRange(offsets, 0, 480, 6)).toEqual({ start: 0, end: 16 });
  expect(visibleRange(offsets, 4800, 480, 6)).toEqual({ start: 94, end: 116 });
  expect(visibleRange(offsets, 48 * 9995, 480, 6)).toEqual({ start: 9989, end: 10_000 });
  // A list not yet reached (window scroller) still renders its first rows.
  expect(visibleRange(offsets, -2000, 480, 6)).toEqual({ start: 0, end: 7 });
});

test('alignment: start, end, centre and the least scroll for auto', () => {
  const offsets = rowOffsets(100, () => 50);
  expect(alignedOffset(offsets, 10, 400, 0, 'start')).toBe(500);
  expect(alignedOffset(offsets, 10, 400, 0, 'end')).toBe(150);
  expect(alignedOffset(offsets, 10, 400, 0, 'center')).toBe(325);
  // Already fully visible: no scroll.
  expect(alignedOffset(offsets, 3, 400, 100, 'auto')).toBe(100);
  // Below: just enough to show its bottom; above: its top.
  expect(alignedOffset(offsets, 20, 400, 100, 'auto')).toBe(650);
  expect(alignedOffset(offsets, 1, 400, 100, 'auto')).toBe(50);
});

test('VirtualWindow mixes measurements, keyed by row, with the estimate', () => {
  let keys = ['a', 'b', 'c', 'd'];
  const view = new VirtualWindow({
    count: () => keys.length,
    keyAt: (index) => keys[index] ?? index,
    estimateSize: () => 40,
    overscan: () => 0,
    measure: () => true,
  });
  expect(view.totalSize).toBe(160);

  view.setSize('b', 100);
  expect(view.offsetOf(2)).toBe(140);
  expect(view.totalSize).toBe(220);

  // A prepended row keeps "b"'s measurement with "b", not with index 1.
  keys = ['z', ...keys];
  view.setSize('z', 40);
  expect(view.offsetOf(2)).toBe(80);
  expect(view.offsetOf(3)).toBe(180);

  view.viewportSize = 100;
  view.scrollOffset = 90;
  expect(view.range).toEqual({ start: 2, end: 4 });
  expect(view.alignedOffset(4, 'start')).toBe(220);
});

test('VirtualWindow ignores measurements when rows are fixed', () => {
  const view = new VirtualWindow({
    count: () => 3,
    keyAt: (index) => index,
    estimateSize: () => 30,
    overscan: () => 0,
    measure: () => false,
  });
  view.setSize(0, 500);
  expect(view.totalSize).toBe(90);
});
