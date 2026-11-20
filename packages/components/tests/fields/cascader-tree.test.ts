import { describe, expect, test } from 'vite-plus/test';
import {
  isBranch,
  resolvePath,
  searchTree,
  type CascaderNode,
  type ChildrenOf,
} from '../../src/lib/fields/cascader.ts';

const tree: readonly CascaderNode[] = [
  {
    value: 'au',
    label: 'Australia',
    children: [
      {
        value: 'vic',
        label: 'Victoria',
        children: [
          { value: 'mel', label: 'Melbourne' },
          { value: 'gee', label: 'Geelong' },
        ],
      },
      { value: 'nsw', label: 'New South Wales', hasChildren: true },
    ],
  },
  {
    value: 'nz',
    label: 'New Zealand',
    disabled: true,
    children: [{ value: 'akl', label: 'Auckland' }],
  },
];

const inline: ChildrenOf = (_, node) => node.children;
const loaded: ChildrenOf = (path, node) =>
  path.join('/') === 'au/nsw' ? [{ value: 'syd', label: 'Sydney' }] : node.children;

describe('isBranch', () => {
  test('inline children or a lazy flag make a branch; an empty list does not', () => {
    expect(isBranch({ value: 'a', label: 'A', children: [] })).toBe(false);
    expect(isBranch({ value: 'a', label: 'A', hasChildren: true })).toBe(true);
    expect(isBranch(tree[0] ?? { value: '', label: '' })).toBe(true);
  });
});

describe('resolvePath', () => {
  test('resolves every value it can, stopping at the first unknown', () => {
    expect(resolvePath(tree, ['au', 'vic', 'gee'], inline).map((node) => node.label)).toEqual([
      'Australia',
      'Victoria',
      'Geelong',
    ]);
    expect(resolvePath(tree, ['au', 'nsw', 'syd'], inline).map((node) => node.value)).toEqual([
      'au',
      'nsw',
    ]);
  });

  test('reads lazily loaded children through childrenOf', () => {
    expect(resolvePath(tree, ['au', 'nsw', 'syd'], loaded).at(-1)?.label).toBe('Sydney');
  });
});

describe('searchTree', () => {
  const options = { childrenOf: inline, selectParents: false, limit: 10 };

  test('finds leaves at any depth, ignoring case, as full paths', () => {
    const found = searchTree(tree, 'MEL', options);
    expect(found.map((path) => path.map((node) => node.value))).toEqual([['au', 'vic', 'mel']]);
  });

  test('skips branches unless selectParents, and everything under a disabled node', () => {
    expect(searchTree(tree, 'vic', options)).toEqual([]);
    expect(searchTree(tree, 'vic', { ...options, selectParents: true })).toHaveLength(1);
    expect(searchTree(tree, 'auck', options)).toEqual([]);
  });

  test('stops at the limit and finds nothing for a blank query', () => {
    expect(searchTree(tree, 'e', { ...options, limit: 1 })).toHaveLength(1);
    expect(searchTree(tree, '  ', options)).toEqual([]);
  });
});
