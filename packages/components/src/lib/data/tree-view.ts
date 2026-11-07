/**
 * The data model and the keyboard arithmetic behind `TreeView`.
 *
 * Every key the APG Tree View pattern defines resolves to a move over one
 * list: the nodes currently visible, in reading order, each with its level,
 * its parent and its position among its siblings. {@link visibleTreeNodes}
 * flattens the tree into that list once per change, and every function after
 * it is a pure lookup over the result — so the next node, the parent, the
 * first child and a typeahead match are unit-testable without a browser, and
 * `TreeView.svelte` only wires events to them.
 *
 * @module
 */

/**
 * One node of a `TreeView`. `children` absent means a leaf; `[]` on a tree
 * given `loadChildren` means a parent whose children are not loaded yet.
 */
export interface TreeNode<T = unknown> {
  /** Stable identity, unique across the whole tree: the key of the expanded and selected sets. */
  readonly id: string;
  /** The node's text: its default row, and what typeahead matches. */
  readonly label: string;
  /** The child nodes; absent for a leaf. */
  readonly children?: readonly TreeNode<T>[] | undefined;
  /** Focusable, but cannot be selected or activated. */
  readonly disabled?: boolean | undefined;
  /** The caller's own payload, handed back to `row` and `onActivate`. */
  readonly data?: T | undefined;
}

/** One entry of the flattened, visible order a tree's keyboard moves through. */
export interface VisibleTreeNode<T = unknown> {
  readonly node: TreeNode<T>;
  /** 1-based depth, as `aria-level` states it. */
  readonly level: number;
  /** The parent's id, or `undefined` for a root. */
  readonly parentId: string | undefined;
  /** Whether the node is a parent (carries `aria-expanded`). */
  readonly parent: boolean;
  /** Whether the node is a parent and currently expanded. */
  readonly expanded: boolean;
  /** Number of siblings including the node, as `aria-setsize`. */
  readonly setSize: number;
  /** 1-based position among its siblings, as `aria-posinset`. */
  readonly posInSet: number;
}

/** How a tree resolves a node's children and whether it is a parent. */
export interface TreeShape<T = unknown> {
  /** The node's children as currently known (loaded children win over the node's own). */
  readonly childrenOf: (node: TreeNode<T>) => readonly TreeNode<T>[] | undefined;
  /** Whether the node is a parent: it has children, or children still to load. */
  readonly isParent: (node: TreeNode<T>) => boolean;
}

/** The shape of a tree whose children are all in its nodes: a node is a parent when it has any. */
export function staticTreeShape<T>(): TreeShape<T> {
  return {
    childrenOf: (node) => node.children,
    isParent: (node) => (node.children?.length ?? 0) > 0,
  };
}

/**
 * Flatten `nodes` into the order a reader moves through them: every root,
 * and under each expanded parent its children, depth first.
 */
export function visibleTreeNodes<T>(
  nodes: readonly TreeNode<T>[],
  expanded: ReadonlySet<string>,
  shape: TreeShape<T> = staticTreeShape(),
): VisibleTreeNode<T>[] {
  const out: VisibleTreeNode<T>[] = [];
  const walk = (list: readonly TreeNode<T>[], level: number, parentId: string | undefined) => {
    for (const [index, node] of list.entries()) {
      const parent = shape.isParent(node);
      const open = parent && expanded.has(node.id);
      out.push({
        node,
        level,
        parentId,
        parent,
        expanded: open,
        setSize: list.length,
        posInSet: index + 1,
      });
      const children = shape.childrenOf(node);
      if (open && children !== undefined) walk(children, level + 1, node.id);
    }
  };
  walk(nodes, 1, undefined);
  return out;
}

/** Index of the node with `id` in `visible`, or -1. */
export function treeIndexOf<T>(
  visible: readonly VisibleTreeNode<T>[],
  id: string | undefined,
): number {
  return id === undefined ? -1 : visible.findIndex((entry) => entry.node.id === id);
}

/** ↓: the next visible node, or `index` itself at the end. */
export function nextTreeIndex<T>(visible: readonly VisibleTreeNode<T>[], index: number): number {
  return Math.min(visible.length - 1, index + 1);
}

/** ↑: the previous visible node, or `index` itself at the start. */
export function previousTreeIndex(index: number): number {
  return Math.max(0, index - 1);
}

/** ← on a closed parent or a leaf: the parent's index, or -1 for a root. */
export function parentTreeIndex<T>(visible: readonly VisibleTreeNode<T>[], index: number): number {
  return treeIndexOf(visible, visible[index]?.parentId);
}

/** → on an open parent: the first child's index, or -1 when it has none visible. */
export function firstChildTreeIndex<T>(
  visible: readonly VisibleTreeNode<T>[],
  index: number,
): number {
  const entry = visible[index];
  const next = visible[index + 1];
  return entry !== undefined && next !== undefined && next.parentId === entry.node.id
    ? index + 1
    : -1;
}

/** `*`: the ids of the parents among the focused node's siblings (itself included). */
export function siblingParentIds<T>(
  visible: readonly VisibleTreeNode<T>[],
  index: number,
): string[] {
  const entry = visible[index];
  if (entry === undefined) return [];
  return visible
    .filter(
      (other) => other.parentId === entry.parentId && other.level === entry.level && other.parent,
    )
    .map((other) => other.node.id);
}

/**
 * Typeahead: the first visible node after `index` (wrapping) whose label
 * starts with `query`, case-insensitively; -1 when none does.
 *
 * A query of one character repeated ("rrr") matches that single character,
 * so pressing the same key again cycles through every node starting with it,
 * as the APG pattern recommends.
 */
export function typeaheadTreeIndex<T>(
  visible: readonly VisibleTreeNode<T>[],
  index: number,
  query: string,
): number {
  const lowered = query.toLocaleLowerCase();
  if (lowered === '' || visible.length === 0) return -1;
  const first = lowered.charAt(0);
  const repeated = lowered === first.repeat(lowered.length);
  const needle = repeated ? first : lowered;
  // A fresh multi-character query may still match the node it started from
  // ("m" focused Malus, "ma" keeps it); a repeated key always moves on.
  const start = repeated ? index + 1 : index;
  for (let offset = 0; offset < visible.length; offset += 1) {
    const at = (((start + offset) % visible.length) + visible.length) % visible.length;
    if (visible[at]?.node.label.toLocaleLowerCase().startsWith(needle) === true) return at;
  }
  return -1;
}

/** Whether a tree's nodes can be selected, and how many at once. */
export type TreeSelection = 'none' | 'single' | 'multiple';

/** What a `TreeView` `row` snippet is told about the node it draws. */
export interface TreeRowState {
  readonly expanded: boolean;
  readonly selected: boolean;
  /** 1-based depth. */
  readonly level: number;
}
