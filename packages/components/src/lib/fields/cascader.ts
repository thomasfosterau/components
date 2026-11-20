/**
 * `Cascader`'s tree arithmetic: resolving a path of values to nodes, and
 * searching every level. Pure, so each is tested without a browser; the
 * component passes `childrenOf`, which also reads children loaded lazily.
 *
 * @module
 */

/** One node of a `Cascader` hierarchy. */
export interface CascaderNode {
  readonly value: string;
  readonly label: string;
  /** The node's children, when they are known up front. */
  readonly children?: readonly CascaderNode[] | undefined;
  /** The node has children that `loadChildren` fetches on demand. */
  readonly hasChildren?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}

/** A node's children: inline, or loaded for the path that ends at it. */
export type ChildrenOf = (
  path: readonly string[],
  node: CascaderNode,
) => readonly CascaderNode[] | undefined;

/** Whether a node opens another column. */
export const isBranch = (node: CascaderNode): boolean =>
  (node.children !== undefined && node.children.length > 0) || node.hasChildren === true;

/** A stable key for a path of values, for caches keyed by path. */
export const pathKey = (path: readonly string[]): string => JSON.stringify(path);

/**
 * The nodes along `path`, from the root: as many as can be resolved, so a
 * path into children not loaded yet resolves only its known prefix.
 */
export const resolvePath = (
  roots: readonly CascaderNode[],
  path: readonly string[],
  childrenOf: ChildrenOf,
): CascaderNode[] => {
  const nodes: CascaderNode[] = [];
  let level: readonly CascaderNode[] | undefined = roots;
  for (const [depth, value] of path.entries()) {
    const node: CascaderNode | undefined = level?.find((entry) => entry.value === value);
    if (node === undefined) break;
    nodes.push(node);
    level = childrenOf(path.slice(0, depth + 1), node);
  }
  return nodes;
};

/**
 * Every choosable path whose last node's label contains `query`, ignoring
 * case, depth first and in tree order, up to `limit`. Choosable means a
 * leaf, or any enabled node when `selectParents`; a disabled node and
 * everything under it is skipped.
 */
export const searchTree = (
  roots: readonly CascaderNode[],
  query: string,
  options: {
    readonly childrenOf: ChildrenOf;
    readonly selectParents: boolean;
    readonly limit: number;
  },
): CascaderNode[][] => {
  const needle = query.trim().toLowerCase();
  const found: CascaderNode[][] = [];
  if (needle === '') return found;
  const visit = (level: readonly CascaderNode[], trail: readonly CascaderNode[]): void => {
    for (const node of level) {
      if (found.length >= options.limit) return;
      if (node.disabled === true) continue;
      const path = [...trail, node];
      const branch = isBranch(node);
      if ((!branch || options.selectParents) && node.label.toLowerCase().includes(needle)) {
        found.push(path);
      }
      const children = options.childrenOf(
        path.map((entry) => entry.value),
        node,
      );
      if (children !== undefined) visit(children, path);
    }
  };
  visit(roots, []);
  return found;
};

/** The promise's value, or `undefined` when it rejects. */
export const settle = async <T>(promise: Promise<T>): Promise<T | undefined> => {
  try {
    return await promise;
  } catch {
    return undefined;
  }
};
