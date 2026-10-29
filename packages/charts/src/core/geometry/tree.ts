import type { Channel, Datum, TreeOptions } from '../../spec/index.ts';
import { makeAccessor, type FieldValue } from '../accessor.ts';
import type { Box, DataRows, ResolvedScale } from '../types.ts';
import { colorOfDatum } from './series.ts';
import type { TreeGeometry, TreeLink, TreeNodeBox, TreeOutlineNode } from './types.ts';

/**
 * The inline style every interpreter puts on a tree's nested-list text
 * alternative: in the accessibility tree, out of sight (the classic
 * visually-hidden pattern, inline because these interpreters ship no CSS).
 */
export const VISUALLY_HIDDEN_STYLE =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

/** The text of one outline entry: its label, then its colour category in words. */
export function outlineText(node: {
  readonly label: string;
  readonly category: string | undefined;
}): string {
  return node.category === undefined ? node.label : `${node.label}, ${node.category}`;
}

/** Height of a node box, in pixels. */
const NODE_HEIGHT = 28;
/** The width of one label character, estimated (the pure path has no text measurer). */
const CHAR_WIDTH = 7;
/** Horizontal padding inside a node box. */
const NODE_PADDING = 16;
/** The narrowest a node box gets. */
const MIN_NODE_WIDTH = 24;

/** One row of the hierarchy, after validation. */
interface TreeRow {
  readonly id: string;
  readonly label: string;
  readonly datum: Datum;
  readonly children: TreeRow[];
}

/** A node placed in unit layout coordinates: `slot` along the breadth, `depth` along the depth. */
interface Placed {
  readonly row: TreeRow;
  readonly slot: number;
  readonly depth: number;
  readonly parent: Placed | undefined;
}

/** How a channel's value names a node: dates as ISO strings, everything else as text. */
function keyOf(value: FieldValue): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Turns rows into a forest, checking the row-level rules `parseSpec` cannot:
 * ids are present and unique, every parent is an id, and there are no
 * cycles. Each error names the offending row (1-based), and is thrown, so
 * `resolveChart` shows it in place of the chart.
 */
function buildForest(
  data: DataRows,
  id: Channel,
  parent: Channel,
  label: Channel | undefined,
): TreeRow[] {
  const idOf = makeAccessor(id);
  const parentOf = makeAccessor(parent);
  const labelOf = label === undefined ? undefined : makeAccessor(label);

  const byId = new Map<string, TreeRow>();
  const parents = new Map<string, string | null>();
  data.forEach((datum, index) => {
    const key = keyOf(idOf(datum));
    if (key === null) throw new Error(`Tree row ${index + 1}: missing id`);
    if (byId.has(key)) throw new Error(`Tree row ${index + 1}: duplicate id "${key}"`);
    byId.set(key, { id: key, label: keyOf(labelOf?.(datum) ?? null) ?? key, datum, children: [] });
    parents.set(key, keyOf(parentOf(datum)));
  });

  const roots: TreeRow[] = [];
  data.forEach((datum, index) => {
    const key = keyOf(idOf(datum)) ?? '';
    const row = byId.get(key);
    const parentKey = parents.get(key) ?? null;
    if (row === undefined) return;
    if (parentKey === null) {
      roots.push(row);
      return;
    }
    const parentRow = byId.get(parentKey);
    if (parentRow === undefined)
      throw new Error(`Tree row ${index + 1}: parent "${parentKey}" is not an id`);
    parentRow.children.push(row);
  });

  // Every row must hang from a root; one that does not sits on a cycle.
  const reached = new Set<string>();
  const visit = (row: TreeRow): void => {
    reached.add(row.id);
    row.children.forEach(visit);
  };
  roots.forEach(visit);
  const stranded = data.findIndex((datum) => !reached.has(keyOf(idOf(datum)) ?? ''));
  if (stranded !== -1) throw new Error(`Tree row ${stranded + 1}: its parents form a cycle`);
  return roots;
}

/**
 * Places the forest in unit coordinates: leaves take consecutive breadth
 * slots in depth-first order, and every parent sits centred over its first
 * and last child. Linear in the number of rows, never overlapping (siblings'
 * subtrees occupy disjoint slot ranges), and a forest's roots stand side by
 * side as if under one invisible root.
 */
function place(roots: readonly TreeRow[]): {
  readonly nodes: Placed[];
  readonly leaves: number;
  readonly depth: number;
} {
  const nodes: Placed[] = [];
  let nextLeaf = 0;
  let maxDepth = 0;
  const walk = (row: TreeRow, depth: number, parent: Placed | undefined): Placed => {
    maxDepth = Math.max(maxDepth, depth);
    // A placeholder parent link for the children; the slot is fixed after them.
    const index = nodes.length;
    nodes.push({ row, slot: 0, depth, parent });
    if (row.children.length === 0) {
      const leaf = { row, slot: nextLeaf, depth, parent };
      nextLeaf += 1;
      nodes[index] = leaf;
      return leaf;
    }
    const self: { row: TreeRow; slot: number; depth: number; parent: Placed | undefined } = {
      row,
      slot: 0,
      depth,
      parent,
    };
    nodes[index] = self;
    const placed = row.children.map((child) => walk(child, depth + 1, self));
    self.slot = ((placed[0]?.slot ?? 0) + (placed.at(-1)?.slot ?? 0)) / 2;
    return self;
  };
  roots.forEach((root) => walk(root, 0, undefined));
  return { nodes, leaves: Math.max(nextLeaf, 1), depth: maxDepth };
}

/** The nested depth-first structure of the forest: the interpreters' text alternative. */
function outlineOf(rows: readonly TreeRow[], color: Channel | undefined): TreeOutlineNode[] {
  const categoryOf = color === undefined ? undefined : makeAccessor(color);
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    category: keyOf(categoryOf?.(row.datum) ?? null) ?? undefined,
    children: outlineOf(row.children, color),
  }));
}

/** An SVG path from a parent's edge to a child's, along the depth axis. */
function linkPath(from: TreeNodeBox, to: TreeNodeBox, vertical: boolean, curved: boolean): string {
  if (vertical) {
    const x1 = from.x + from.width / 2;
    const y1 = from.y + from.height;
    const x2 = to.x + to.width / 2;
    const y2 = to.y;
    const mid = (y1 + y2) / 2;
    return curved
      ? `M${x1},${y1}C${x1},${mid} ${x2},${mid} ${x2},${y2}`
      : `M${x1},${y1}V${mid}H${x2}V${y2}`;
  }
  const x1 = from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = to.x;
  const y2 = to.y + to.height / 2;
  const mid = (x1 + x2) / 2;
  return curved
    ? `M${x1},${y1}C${mid},${y1} ${mid},${y2} ${x2},${y2}`
    : `M${x1},${y1}H${mid}V${y2}H${x2}`;
}

/** The plot's measurements along the breadth and depth axes. */
interface Frame {
  readonly vertical: boolean;
  /** The deepest node's depth. */
  readonly depth: number;
  /** The plot's extent along the depth axis, in pixels. */
  readonly length: number;
  /** One leaf slot along the breadth axis, in pixels. */
  readonly slotSize: number;
}

/** A placed node's box in plot pixels: sized from its label, centred in its slot, at its depth's level. */
function boxOf(node: Placed, frame: Frame, color: string | undefined): TreeNodeBox {
  const { vertical, depth, length, slotSize } = frame;
  const levelSize = depth === 0 ? 0 : length / depth;
  const estimate = node.row.label.length * CHAR_WIDTH + NODE_PADDING;
  const width = vertical
    ? Math.max(Math.min(estimate, slotSize - 4), MIN_NODE_WIDTH)
    : Math.max(Math.min(estimate, Math.max(levelSize - 16, MIN_NODE_WIDTH)), MIN_NODE_WIDTH);
  const height = vertical ? NODE_HEIGHT : Math.min(NODE_HEIGHT, slotSize - 4);
  const centreBreadth = (node.slot + 0.5) * slotSize;
  const depthStart =
    depth === 0 ? 0 : (node.depth / depth) * (length - (vertical ? height : width));
  return {
    id: node.row.id,
    label: node.row.label,
    depth: node.depth,
    x: vertical ? centreBreadth - width / 2 : depthStart,
    y: vertical ? depthStart : centreBreadth - height / 2,
    width,
    height,
    color,
    datum: node.row.datum,
  };
}

/** One link per non-root node, from its parent's box to its own. */
function linksOf(
  nodes: readonly Placed[],
  boxes: ReadonlyMap<Placed, TreeNodeBox>,
  vertical: boolean,
  curved: boolean,
): TreeLink[] {
  return nodes.flatMap((node) => {
    const box = boxes.get(node);
    const parentBox = node.parent === undefined ? undefined : boxes.get(node.parent);
    return box === undefined || parentBox === undefined
      ? []
      : [{ from: parentBox.id, to: box.id, path: linkPath(parentBox, box, vertical, curved) }];
  });
}

/**
 * Builds a `tree` mark's geometry (spec 1.1): node boxes, the links between
 * them and the nested outline the interpreters render as the accessible
 * text alternative. Pure and DOM-free; label widths are estimated from
 * character counts, as the pure path's tick layout does.
 *
 * @throws {Error} on a duplicate or missing id, an unknown parent, or a cycle; the message names the row.
 */
export function buildTreeGeometry(args: {
  readonly data: DataRows;
  readonly plot: Box;
  readonly id: Channel;
  readonly parent: Channel;
  readonly label?: Channel | undefined;
  readonly color?: Channel | undefined;
  readonly colorScale?: ResolvedScale | undefined;
  readonly options?: TreeOptions | undefined;
}): TreeGeometry {
  const roots = buildForest(args.data, args.id, args.parent, args.label);
  const { nodes, leaves, depth } = place(roots);
  const vertical = args.options?.orientation !== 'horizontal';
  const curved = args.options?.linkStyle === 'curved';

  const breadth = vertical ? args.plot.width : args.plot.height;
  const length = vertical ? args.plot.height : args.plot.width;
  const frame: Frame = { vertical, depth, length, slotSize: breadth / leaves };

  const boxes = new Map<Placed, TreeNodeBox>(
    nodes.map((node) => [
      node,
      boxOf(node, frame, colorOfDatum(node.row.datum, args.color, args.colorScale)),
    ]),
  );
  const links = linksOf(nodes, boxes, vertical, curved);

  return {
    mark: 'tree',
    nodes: nodes
      .map((node) => boxes.get(node))
      .filter((box): box is TreeNodeBox => box !== undefined),
    links,
    outline: outlineOf(roots, args.color),
  };
}
