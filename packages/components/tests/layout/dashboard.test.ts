/**
 * The dashboard layout model: collisions push down and compact up, the
 * first tile landed on swaps into the mover's cell, packing keeps order,
 * and no operation leaves two tiles overlapping.
 */

import { describe, expect, test } from 'vite-plus/test';
import {
  columnsAt,
  compact,
  hideTile,
  moveInOrder,
  normaliseLayout,
  overlaps,
  pack,
  placeTile,
  readingOrder,
  reflow,
  resizeTile,
  sameLayout,
  showTile,
  sizeOf,
  type TileLayout,
  widestColumns,
} from '../../src/lib/layout/dashboard.ts';

const tile = (id: string, x: number, y: number, w = 1, h = 1): TileLayout => ({ id, x, y, w, h });

const at = (layout: readonly TileLayout[], id: string) => {
  const found = layout.find((each) => each.id === id);
  return found === undefined ? undefined : { x: found.x, y: found.y, w: found.w, h: found.h };
};

const noOverlaps = (layout: readonly TileLayout[]): boolean => {
  const shown = readingOrder(layout);
  return shown.every((a, i) => shown.slice(i + 1).every((b) => !overlaps(a, b)));
};

const row = [tile('a', 0, 0), tile('b', 1, 0), tile('c', 2, 0)];

describe('placeTile', () => {
  test('swaps with the tile it lands on', () => {
    const next = placeTile(row, 'a', { x: 1, y: 0 }, 3);
    expect(at(next, 'a')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
    expect(at(next, 'b')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(noOverlaps(next)).toBe(true);
  });

  test('swaps vertically', () => {
    const stacked = [tile('a', 0, 0), tile('b', 0, 1)];
    const next = placeTile(stacked, 'a', { x: 0, y: 1 }, 2);
    expect(at(next, 'a')?.y).toBe(1);
    expect(at(next, 'b')?.y).toBe(0);
  });

  test('pushes down a tile that cannot take the old cell, and compacts', () => {
    const layout = [tile('big', 0, 0, 2, 2), tile('x', 2, 0), tile('y', 2, 1)];
    const next = placeTile(layout, 'big', { x: 1, y: 0 }, 3);
    expect(at(next, 'big')).toEqual({ x: 1, y: 0, w: 2, h: 2 });
    expect(at(next, 'x')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(at(next, 'y')?.y).toBe(2);
    expect(noOverlaps(next)).toBe(true);
  });

  test('a tile moved into empty space below floats back up', () => {
    const next = placeTile([tile('a', 0, 0), tile('b', 1, 0)], 'a', { x: 0, y: 3 }, 2);
    expect(at(next, 'a')?.y).toBe(0);
  });

  test('clamps the target into the grid', () => {
    const next = placeTile(row, 'a', { x: 9, y: -2 }, 3);
    expect(at(next, 'a')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
    expect(noOverlaps(next)).toBe(true);
  });

  test('never overlaps, wherever a tile is dropped', () => {
    const layout = [tile('a', 0, 0, 2, 1), tile('b', 2, 0, 1, 2), tile('c', 0, 1), tile('d', 1, 1)];
    for (let x = 0; x < 3; x += 1) {
      for (let y = 0; y < 4; y += 1) {
        for (const each of layout)
          expect(noOverlaps(placeTile(layout, each.id, { x, y }, 3))).toBe(true);
      }
    }
  });
});

describe('compact', () => {
  test('floats tiles up without jumping over another', () => {
    const next = compact([tile('wide', 0, 1, 2), tile('s', 1, 0), tile('t', 0, 2)], 2);
    expect(at(next, 'wide')?.y).toBe(1);
    expect(at(next, 't')?.y).toBe(2);
  });

  test('keeps hidden tiles as they are', () => {
    const next = compact([tile('a', 0, 3), { ...tile('h', 0, 0), hidden: true }], 2);
    expect(at(next, 'a')?.y).toBe(0);
    expect(next.find((each) => each.id === 'h')?.hidden).toBe(true);
  });
});

describe('pack, reflow and moveInOrder', () => {
  test('pack keeps order and wraps', () => {
    const packed = pack([tile('a', 0, 0, 2), tile('b', 0, 0, 2), tile('c', 0, 0)], 3);
    expect(packed.map((each) => [each.id, each.x, each.y])).toEqual([
      ['a', 0, 0],
      ['b', 0, 1],
      ['c', 2, 1],
    ]);
  });

  test('reflow to one column stacks in reading order', () => {
    const layout = [tile('c', 1, 1), tile('a', 0, 0, 2), tile('b', 0, 1)];
    const one = reflow(layout, 1);
    expect(one.map((each) => each.id)).toEqual(['a', 'b', 'c']);
    expect(one.map((each) => each.y)).toEqual([0, 1, 2]);
    expect(one.every((each) => each.w === 1)).toBe(true);
  });

  test('moveInOrder moves to start and end', () => {
    expect(readingOrder(moveInOrder(row, 'c', 0, 3)).map((each) => each.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(readingOrder(moveInOrder(row, 'a', Infinity, 3)).map((each) => each.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });
});

describe('resize, hide and show', () => {
  test('resizeTile pushes what it now covers down', () => {
    const next = resizeTile(row, 'a', { w: 2, h: 1 }, 3);
    expect(at(next, 'a')).toEqual({ x: 0, y: 0, w: 2, h: 1 });
    expect(at(next, 'b')).toEqual({ x: 1, y: 1, w: 1, h: 1 });
    expect(noOverlaps(next)).toBe(true);
  });

  test('resizeTile clamps a span wider than the grid', () => {
    expect(at(resizeTile(row, 'c', { w: 4, h: 1 }, 3), 'c')).toEqual({ x: 0, y: 0, w: 3, h: 1 });
  });

  test('hideTile removes and compacts; showTile appends a new row', () => {
    const stacked = [tile('a', 0, 0), tile('b', 0, 1), tile('c', 0, 2)];
    const hidden = hideTile(stacked, 'a', 1);
    expect(readingOrder(hidden).map((each) => [each.id, each.y])).toEqual([
      ['b', 0],
      ['c', 1],
    ]);
    const shown = showTile(hidden, 'a', 1);
    expect(at(shown, 'a')).toEqual({ x: 0, y: 2, w: 1, h: 1 });
  });
});

describe('normaliseLayout', () => {
  test('drops unknown tiles, appends missing ones and settles overlaps', () => {
    const next = normaliseLayout(
      [tile('a', 0, 0), tile('a2', 0, 0), tile('ghost', 1, 1), { ...tile('b', 0, 0), id: 'b' }],
      [
        { id: 'a', span: { w: 1, h: 1 } },
        { id: 'a2', span: { w: 1, h: 1 } },
        { id: 'b', span: { w: 1, h: 1 } },
        { id: 'new', span: { w: 2, h: 1 } },
      ],
      2,
    );
    expect(next.map((each) => each.id).toSorted()).toEqual(['a', 'a2', 'b', 'new']);
    expect(noOverlaps(next)).toBe(true);
    expect(at(next, 'new')).toEqual({ x: 0, y: 3, w: 2, h: 1 });
  });
});

describe('helpers', () => {
  test('columnsAt reads the widest breakpoint reached, one below sm', () => {
    const columns = { sm: 2, md: 4, lg: 6 };
    expect(columnsAt(390, columns)).toBe(1);
    expect(columnsAt(700, columns)).toBe(2);
    expect(columnsAt(1100, columns)).toBe(6);
    expect(columnsAt(1500, columns)).toBe(6);
    expect(widestColumns(columns)).toBe(6);
  });

  test('sizeOf matches a preset by its clamped spans', () => {
    expect(sizeOf(tile('a', 0, 0, 2, 2), ['sm', 'lg'], 6)).toBe('lg');
    expect(sizeOf(tile('a', 0, 0, 3, 1), ['sm', 'wide'], 3)).toBe('wide');
    expect(sizeOf(tile('a', 0, 0, 3, 3), ['sm'], 6)).toBeUndefined();
  });

  test('sameLayout compares placements regardless of order', () => {
    expect(sameLayout(row, row.toReversed())).toBe(true);
    expect(sameLayout(row, placeTile(row, 'a', { x: 1, y: 0 }, 3))).toBe(false);
  });
});
