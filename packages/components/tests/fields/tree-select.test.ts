/**
 * `TreeSelect`'s value arithmetic: tri-state parents from checked leaves,
 * toggling a subtree, the three reporting strategies, and filtering.
 */

import { describe, expect, test } from 'vite-plus/test';
import type { TreeNode } from '../../src/lib/data/tree-view.ts';
import {
  checkState,
  filterTree,
  leavesOfValue,
  toggleCheck,
  valueOfLeaves,
} from '../../src/lib/fields/tree-select.ts';

const zoneA: TreeNode = {
  id: 'zone-a',
  label: 'Zone A',
  children: [
    { id: 'bed-1', label: 'Bed 1' },
    { id: 'bed-2', label: 'Bed 2' },
    { id: 'bed-3', label: 'Bed 3', disabled: true },
  ],
};
const nodes: readonly TreeNode[] = [
  zoneA,
  { id: 'zone-b', label: 'Zone B', children: [{ id: 'bed-4', label: 'Bed 4' }] },
];

describe('checkState', () => {
  test('is mixed while only some leaves are checked', () => {
    expect(checkState(zoneA, new Set())).toBe(false);
    expect(checkState(zoneA, new Set(['bed-1']))).toBe('mixed');
    expect(checkState(zoneA, new Set(['bed-1', 'bed-2', 'bed-3']))).toBe(true);
  });
});

describe('toggleCheck', () => {
  test('checks every enabled leaf, and unchecks a fully checked node', () => {
    expect([...toggleCheck(zoneA, new Set())]).toEqual(['bed-1', 'bed-2']);
    const full = new Set(['bed-1', 'bed-2', 'bed-3']);
    expect([...toggleCheck(zoneA, full)]).toEqual(['bed-3']);
  });
});

describe('valueOfLeaves', () => {
  const allOfA = new Set(['bed-1', 'bed-2', 'bed-3']);

  test.each([
    ['parent', ['zone-a']],
    ['leaf', ['bed-1', 'bed-2', 'bed-3']],
    ['all', ['zone-a', 'bed-1', 'bed-2', 'bed-3']],
  ] as const)('reports a fully checked subtree under %s', (strategy, expected) => {
    expect(valueOfLeaves(nodes, allOfA, strategy)).toEqual(expected);
  });

  test('reports a partly checked subtree by its leaves', () => {
    expect(valueOfLeaves(nodes, new Set(['bed-2', 'bed-4']), 'parent')).toEqual([
      'bed-2',
      'zone-b',
    ]);
  });

  test('round-trips through leavesOfValue', () => {
    expect([...leavesOfValue(nodes, ['zone-a', 'nowhere'])]).toEqual(['bed-1', 'bed-2', 'bed-3']);
  });
});

describe('filterTree', () => {
  test('keeps matches and their ancestors, and lists the ancestors to expand', () => {
    const result = filterTree(nodes, 'bed 2');
    expect(result.matches).toBe(1);
    expect(result.ancestors).toEqual(['zone-a']);
    expect(result.nodes).toEqual([{ ...zoneA, children: [{ id: 'bed-2', label: 'Bed 2' }] }]);
  });

  test('ignores case and accents, and keeps everything for an empty query', () => {
    expect(filterTree([{ id: 'x', label: 'Café' }], 'CAFE').matches).toBe(1);
    expect(filterTree(nodes, '  ').nodes).toBe(nodes);
  });
});
