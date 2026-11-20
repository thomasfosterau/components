/**
 * `JsonView`'s model: JSONPath ids, types and sizes, cycles as leaves,
 * depth expansion, and a filter that keeps ancestors.
 */

import { describe, expect, test } from 'vite-plus/test';
import {
  containerIds,
  filterJson,
  formatJsonPath,
  idsToDepth,
  jsonTree,
  toJson,
} from '../../src/lib/data/json-path.ts';

const garden = {
  name: 'Allotment',
  count: 12,
  open: true,
  owner: null,
  beds: [{ name: 'Tomato' }, { name: 'Bean' }, { name: 'Tomato cherry', 'odd key': 1 }],
};

test('formatJsonPath uses dots for identifiers and brackets otherwise', () => {
  expect(formatJsonPath([])).toBe('$');
  expect(formatJsonPath(['beds', 2, 'name'])).toBe('$.beds[2].name');
  expect(formatJsonPath(['odd key', '$ok'])).toBe('$["odd key"].$ok');
});

describe('jsonTree', () => {
  test('ids are paths; entries carry kind and size', () => {
    const root = jsonTree(garden);
    expect(root.id).toBe('$');
    expect(root.data).toMatchObject({ kind: 'object', size: 5 });
    const ids = root.children?.map((node) => node.id);
    expect(ids).toEqual(['$.name', '$.count', '$.open', '$.owner', '$.beds']);
    expect(root.children?.map((node) => node.data?.kind)).toEqual([
      'string',
      'number',
      'boolean',
      'null',
      'array',
    ]);
    const beds = root.children?.at(-1);
    expect(beds?.data?.size).toBe(3);
    expect(beds?.children?.[2]?.children?.[1]?.id).toBe('$.beds[2]["odd key"]');
  });

  test('sortKeys sorts object keys, not array items', () => {
    const root = jsonTree({ b: 1, a: [3, 1] }, { sortKeys: true });
    expect(root.children?.map((node) => node.label)).toEqual(['a', 'b']);
    expect(root.children?.[0]?.children?.map((node) => node.data?.value)).toEqual([3, 1]);
  });

  test('a cycle is a circular leaf, not infinite recursion', () => {
    const loop: Record<string, unknown> = { name: 'loop' };
    loop.self = loop;
    const self = jsonTree(loop).children?.[1];
    expect(self?.data?.kind).toBe('circular');
    expect(self?.children).toBeUndefined();
    expect(toJson(loop)).toContain('"self": "[Circular]"');
  });
});

test('idsToDepth and containerIds list containers by depth', () => {
  const root = jsonTree(garden);
  expect(idsToDepth([root], 0)).toEqual([]);
  expect(idsToDepth([root], 1)).toEqual(['$']);
  expect(idsToDepth([root], 2)).toEqual(['$', '$.beds']);
  expect(containerIds([root])).toHaveLength(5);
});

describe('filterJson', () => {
  test('keeps matches and their ancestors, and lists ancestors to expand', () => {
    const result = filterJson([jsonTree(garden)], 'tomato');
    expect(result.matches).toBe(2);
    expect(result.expand).toEqual(
      expect.arrayContaining(['$', '$.beds', '$.beds[0]', '$.beds[2]']),
    );
    const beds = result.nodes[0]?.children;
    expect(beds?.map((node) => node.id)).toEqual(['$.beds']);
    expect(beds?.[0]?.children?.map((node) => node.id)).toEqual(['$.beds[0]', '$.beds[2]']);
  });

  test('matches keys too, and a blank query keeps everything', () => {
    expect(filterJson([jsonTree(garden)], 'OWNER').matches).toBe(1);
    expect(filterJson([jsonTree(garden)], '  ').nodes[0]?.children).toHaveLength(5);
    expect(filterJson([jsonTree(garden)], 'zzz').nodes).toEqual([]);
  });
});
