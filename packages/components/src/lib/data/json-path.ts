/**
 * `JsonView`'s model: a JSON-compatible value turned into `TreeView` nodes
 * keyed by JSONPath, the type of each value, filtering that keeps
 * ancestors, and the paths to expand. Pure, so it is tested without a
 * browser.
 *
 * @module
 */

import type { TreeNode } from './tree-view.ts';

/** What a value is, as `JsonView` names it. */
export type JsonKind = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' | 'circular';

/** One step of a path: an object key or an array index. */
export type JsonPathSegment = string | number;

/** What a `JsonView` node carries. */
export interface JsonEntry {
  /** The key or index under its parent; `undefined` for the root. */
  readonly key: JsonPathSegment | undefined;
  readonly value: unknown;
  readonly kind: JsonKind;
  readonly path: readonly JsonPathSegment[];
  /** Entries in an object or array. */
  readonly size: number;
}

const identifier = /^[A-Za-z_$][\w$]*$/u;

/** A path in JSONPath's notation: `$.beds[2].name`, `$["odd key"]`. */
export const formatJsonPath = (path: readonly JsonPathSegment[]): string =>
  path.reduce<string>((text, segment) => {
    if (typeof segment === 'number') return `${text}[${segment}]`;
    return identifier.test(segment) ? `${text}.${segment}` : `${text}[${JSON.stringify(segment)}]`;
  }, '$');

const kindOf = (value: unknown): Exclude<JsonKind, 'circular'> => {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
    case 'bigint':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
};

const entriesOf = (value: object, sortKeys: boolean): [JsonPathSegment, unknown][] => {
  if (Array.isArray(value)) return value.map((item, index) => [index, item]);
  const pairs = Object.entries(value);
  return sortKeys ? pairs.toSorted(([a], [b]) => a.localeCompare(b)) : pairs;
};

/**
 * `value` as one root `TreeNode`, its id `$` and every descendant's id its
 * JSONPath. An object or array already on the path is a `circular` leaf, so
 * a cyclic value never recurses forever.
 */
export const jsonTree = (
  value: unknown,
  { sortKeys = false, rootLabel = 'root' }: { sortKeys?: boolean; rootLabel?: string } = {},
): TreeNode<JsonEntry> => {
  const build = (
    key: JsonPathSegment | undefined,
    item: unknown,
    path: readonly JsonPathSegment[],
    ancestors: readonly unknown[],
  ): TreeNode<JsonEntry> => {
    const id = formatJsonPath(path);
    const label = key === undefined ? rootLabel : String(key);
    const kind = kindOf(item);
    if ((kind !== 'object' && kind !== 'array') || typeof item !== 'object' || item === null) {
      return { id, label, data: { key, value: item, kind, path, size: 0 } };
    }
    if (ancestors.includes(item)) {
      return { id, label, data: { key, value: item, kind: 'circular', path, size: 0 } };
    }
    const pairs = entriesOf(item, sortKeys);
    const inner = [...ancestors, item];
    return {
      id,
      label,
      data: { key, value: item, kind, path, size: pairs.length },
      children: pairs.map(([childKey, child]) =>
        build(childKey, child, [...path, childKey], inner),
      ),
    };
  };
  return build(undefined, value, [], []);
};

/** Ids of the containers less than `depth` levels below `roots` (0 expands nothing). */
export const idsToDepth = (roots: readonly TreeNode<JsonEntry>[], depth: number): string[] => {
  const ids: string[] = [];
  const walk = (nodes: readonly TreeNode<JsonEntry>[], level: number): void => {
    if (level >= depth) return;
    for (const node of nodes) {
      if (node.children === undefined) continue;
      ids.push(node.id);
      walk(node.children, level + 1);
    }
  };
  walk(roots, 0);
  return ids;
};

/** The text a filter matches a primitive value against. */
export const valueText = (entry: JsonEntry): string => {
  if (entry.kind === 'null') return 'null';
  if (entry.kind === 'string') return String(entry.value);
  if (entry.kind === 'number' || entry.kind === 'boolean') return String(entry.value);
  return '';
};

/** The result of filtering a tree. */
export interface JsonFilter {
  /** The roots, pruned to matches and their ancestors (a matching container keeps all its children). */
  readonly nodes: readonly TreeNode<JsonEntry>[];
  /** Ids of every matching node's ancestors, to expand. */
  readonly expand: readonly string[];
  /** How many nodes match. */
  readonly matches: number;
}

/** Nodes whose key or primitive value contains `query` (ignoring case), with their ancestors. */
export const filterJson = (roots: readonly TreeNode<JsonEntry>[], query: string): JsonFilter => {
  const needle = query.trim().toLowerCase();
  if (needle === '') return { nodes: roots, expand: [], matches: 0 };
  const expand: string[] = [];
  let matches = 0;
  const matchesNode = (node: TreeNode<JsonEntry>): boolean => {
    const entry = node.data;
    if (entry === undefined) return false;
    const key = entry.key === undefined ? '' : String(entry.key);
    return key.toLowerCase().includes(needle) || valueText(entry).toLowerCase().includes(needle);
  };
  const prune = (node: TreeNode<JsonEntry>): TreeNode<JsonEntry> | undefined => {
    const hit = matchesNode(node);
    if (hit) matches += 1;
    const kept = (node.children ?? []).flatMap((child) => {
      const pruned = prune(child);
      return pruned === undefined ? [] : [pruned];
    });
    if (kept.length > 0) expand.push(node.id);
    if (hit) return node;
    if (kept.length === 0) return undefined;
    return { ...node, children: kept };
  };
  const nodes = roots.flatMap((root) => {
    const pruned = prune(root);
    return pruned === undefined ? [] : [pruned];
  });
  return { nodes, expand, matches };
};

/** Every container id in `roots`, for Expand all. */
export const containerIds = (roots: readonly TreeNode<JsonEntry>[]): string[] =>
  idsToDepth(roots, Number.POSITIVE_INFINITY);

/** The value as indented JSON, for copying; a cycle is written as `"[Circular]"`. */
export const toJson = (value: unknown): string => {
  const seen = new WeakSet<object>();
  return (
    JSON.stringify(
      value,
      (_key, item: unknown) => {
        if (typeof item === 'bigint') return item.toString();
        if (typeof item !== 'object' || item === null) return item;
        if (seen.has(item)) return '[Circular]';
        seen.add(item);
        return item;
      },
      2,
    ) ?? 'null'
  );
};
