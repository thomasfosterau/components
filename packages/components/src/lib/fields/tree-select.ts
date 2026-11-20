/**
 * `TreeSelect`'s value arithmetic: a multiple selection is held as the set of
 * checked leaves, from which every parent's tri-state, the reported value
 * (per strategy) and the filtered tree are derived. Pure, so it is tested
 * without a browser.
 *
 * @module
 */

import type { TreeNode } from '../data/tree-view.ts';

/**
 * Which values a multiple `TreeSelect` reports for a fully checked subtree:
 * `'parent'` the topmost fully checked node only, `'leaf'` only leaves,
 * `'all'` the node and every descendant.
 */
export type TreeSelectStrategy = 'parent' | 'leaf' | 'all';

const isLeaf = (node: TreeNode): boolean =>
  node.children === undefined || node.children.length === 0;

/** The ids of a node's leaves (the node itself, for a leaf), in tree order. */
export function leafIds(node: TreeNode): string[] {
  if (isLeaf(node)) return [node.id];
  return (node.children ?? []).flatMap(leafIds);
}

/** Every node in tree order, depth first. */
function walk(nodes: readonly TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...walk(node.children ?? [])]);
}

/** A node by its id, anywhere in the tree. */
export function findTreeNode(nodes: readonly TreeNode[], id: string): TreeNode | undefined {
  return walk(nodes).find((node) => node.id === id);
}

/** A node's checkbox state from the checked leaves: `'mixed'` when only some of its leaves are. */
export function checkState(node: TreeNode, checkedLeaves: ReadonlySet<string>): boolean | 'mixed' {
  const leaves = leafIds(node);
  const count = leaves.filter((id) => checkedLeaves.has(id)).length;
  if (count === 0) return false;
  return count === leaves.length ? true : 'mixed';
}

/**
 * The checked leaves after toggling `node`: a fully checked node unchecks
 * every leaf under it, anything else checks every enabled one.
 */
export function toggleCheck(node: TreeNode, checkedLeaves: ReadonlySet<string>): Set<string> {
  const next = new Set(checkedLeaves);
  const enabled = walk([node]).filter((each) => isLeaf(each) && each.disabled !== true);
  const uncheck = checkState(node, checkedLeaves) === true;
  for (const leaf of enabled) {
    if (uncheck) next.delete(leaf.id);
    else next.add(leaf.id);
  }
  return next;
}

/** The checked leaves a value stands for: each value's leaves. Unknown values are dropped. */
export function leavesOfValue(nodes: readonly TreeNode[], value: readonly string[]): Set<string> {
  const leaves = new Set<string>();
  for (const id of value) {
    const node = findTreeNode(nodes, id);
    if (node !== undefined) for (const leaf of leafIds(node)) leaves.add(leaf);
  }
  return leaves;
}

/** The value a set of checked leaves reports under `strategy`, in tree order. */
export function valueOfLeaves(
  nodes: readonly TreeNode[],
  checkedLeaves: ReadonlySet<string>,
  strategy: TreeSelectStrategy,
): string[] {
  if (strategy === 'leaf')
    return walk(nodes)
      .filter((node) => isLeaf(node) && checkedLeaves.has(node.id))
      .map((node) => node.id);
  if (strategy === 'all')
    return walk(nodes)
      .filter((node) => checkState(node, checkedLeaves) === true)
      .map((node) => node.id);
  const topmost = (list: readonly TreeNode[]): string[] =>
    list.flatMap((node) =>
      checkState(node, checkedLeaves) === true ? [node.id] : topmost(node.children ?? []),
    );
  return topmost(nodes);
}

/** A tree cut down to the nodes matching a query, with what it took to show them. */
export interface FilteredTree {
  /** Matching nodes with their subtrees, and their ancestors. */
  readonly nodes: readonly TreeNode[];
  /** How many nodes matched. */
  readonly matches: number;
  /** Ancestors of the matches, to expand so the matches show. */
  readonly ancestors: readonly string[];
}

/**
 * Keeps the nodes whose label contains `query` (case- and accent-insensitive),
 * with their subtrees and their ancestors. An empty query keeps everything.
 */
export function filterTree(
  nodes: readonly TreeNode[],
  query: string,
  locale?: string,
): FilteredTree {
  const fold = (text: string): string =>
    text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(locale);
  const needle = fold(query.trim());
  if (needle === '') return { nodes, matches: 0, ancestors: [] };
  let matches = 0;
  const ancestors: string[] = [];
  const keep = (list: readonly TreeNode[]): TreeNode[] =>
    list.flatMap((node) => {
      if (fold(node.label).includes(needle)) {
        matches += 1;
        return [node];
      }
      const children = keep(node.children ?? []);
      if (children.length === 0) return [];
      ancestors.push(node.id);
      return [{ ...node, children }];
    });
  const kept = keep(nodes);
  return { nodes: kept, matches, ancestors };
}
