/**
 * The `tree` layout: no overlapping boxes, parents centred over their
 * children, depth-first order, row-specific errors, a forest, and
 * horizontal as the transpose of vertical.
 */
import { describe, expect, it } from 'vite-plus/test';
import { buildTreeGeometry, computeContext, resolveChart } from '../../src/core/index.ts';
import type { Channel } from '../../src/spec/index.ts';
import { taxonomy, TAXONOMY_ORDER } from '../fixtures/taxonomy.ts';

const box = { width: 800, height: 400 };
const plot = { width: 800, height: 400 };
const id: Channel = { field: 'id', type: 'nominal' };
const parent: Channel = { field: 'parent', type: 'nominal' };

const overlaps = (
  a: { x: number; y: number; width: number; height: number },
  b: typeof a,
): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('tree layout', () => {
  const geometry = computeContext(taxonomy, box).geometry;
  if (geometry.mark !== 'tree') throw new Error('expected a tree');

  it('places every node once, in depth-first order, with one link per child', () => {
    expect(geometry.nodes.map((node) => node.label)).toEqual([...TAXONOMY_ORDER]);
    expect(geometry.links).toHaveLength(geometry.nodes.length - 1);
  });

  it('never overlaps two node boxes', () => {
    for (const [index, a] of geometry.nodes.entries()) {
      for (const b of geometry.nodes.slice(index + 1))
        expect(overlaps(a, b), `${a.label} / ${b.label}`).toBe(false);
    }
  });

  it('centres each parent over its children', () => {
    const byId = new Map(geometry.nodes.map((node) => [node.id, node]));
    const centre = (key: string): number => {
      const node = byId.get(key);
      if (node === undefined) throw new Error(key);
      return node.x + node.width / 2;
    };
    expect(centre('solanum')).toBeCloseTo((centre('tomato') + centre('aubergine')) / 2);
    expect(centre('solanaceae')).toBeCloseTo((centre('solanum') + centre('capsicum')) / 2);
  });

  it('nests the outline and names colour categories in words', () => {
    const [root] = geometry.outline;
    expect(root?.label).toBe('Solanaceae');
    expect(root?.children.map((child) => child.label)).toEqual(['Solanum', 'Capsicum']);
    expect(root?.children[0]?.children[0]?.category).toBe('grown');
  });

  it('horizontal is the transpose of vertical', () => {
    const rows = [
      { id: 'a', parent: null },
      { id: 'b', parent: 'a' },
      { id: 'c', parent: 'a' },
    ];
    const vertical = buildTreeGeometry({
      data: rows,
      plot: { width: 400, height: 400 },
      id,
      parent,
    });
    const horizontal = buildTreeGeometry({
      data: rows,
      plot: { width: 400, height: 400 },
      id,
      parent,
      options: { orientation: 'horizontal' },
    });
    const centres = (shape: typeof vertical, axis: 'x' | 'y') =>
      shape.nodes.map((node) =>
        axis === 'x' ? node.x + node.width / 2 : node.y + node.height / 2,
      );
    expect(centres(horizontal, 'y')).toEqual(centres(vertical, 'x'));
  });

  it('lays a forest out side by side', () => {
    const forest = buildTreeGeometry({
      data: [
        { id: 'a', parent: null },
        { id: 'b', parent: null },
      ],
      plot,
      id,
      parent,
    });
    expect(forest.nodes).toHaveLength(2);
    expect(forest.links).toHaveLength(0);
    expect(forest.nodes[0]?.y).toBe(forest.nodes[1]?.y);
  });

  it.each([
    [
      'a duplicate id',
      [
        { id: 'a', parent: null },
        { id: 'a', parent: null },
      ],
      'Tree row 2: duplicate id "a"',
    ],
    [
      'an unknown parent',
      [{ id: 'a', parent: 'ghost' }],
      'Tree row 1: parent "ghost" is not an id',
    ],
    [
      'a cycle',
      [
        { id: 'root', parent: null },
        { id: 'a', parent: 'b' },
        { id: 'b', parent: 'a' },
      ],
      'Tree row 2: its parents form a cycle',
    ],
  ])('names the row for %s', (_, rows, message) => {
    expect(() => buildTreeGeometry({ data: rows, plot, id, parent })).toThrow(message);
    const resolved = resolveChart({ ...taxonomy, data: { values: rows } }, box);
    expect(resolved.kind === 'error' ? resolved.message : '').toContain(message);
  });

  it('lays out 2,000 nodes quickly', () => {
    const rows = Array.from({ length: 2000 }, (_, index) => ({
      id: `n${index}`,
      parent: index === 0 ? null : `n${Math.floor((index - 1) / 3)}`,
    }));
    const started = performance.now();
    const big = buildTreeGeometry({ data: rows, plot, id, parent });
    expect(big.nodes).toHaveLength(2000);
    expect(performance.now() - started).toBeLessThan(500);
  });
});
