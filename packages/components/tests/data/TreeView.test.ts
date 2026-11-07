/**
 * `TreeView` is the APG Tree View pattern: one tab stop, the arrow-key
 * contract, typeahead, and selection stated through `aria-selected`. The
 * pure navigation in `tree-view.ts` is pinned first, then the rendered
 * widget through the accessibility tree and the keyboard.
 */

import { SvelteSet } from 'svelte/reactivity';
import { describe, expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import TreeView from '../../src/lib/data/TreeView.svelte';
import {
  firstChildTreeIndex,
  nextTreeIndex,
  parentTreeIndex,
  previousTreeIndex,
  siblingParentIds,
  typeaheadTreeIndex,
  visibleTreeNodes,
  type TreeNode,
} from '../../src/lib/data/tree-view.ts';

const taxa: readonly TreeNode[] = [
  {
    id: 'rosaceae',
    label: 'Rosaceae',
    children: [
      {
        id: 'rosa',
        label: 'Rosa',
        children: [
          { id: 'rosa-canina', label: 'Rosa canina' },
          { id: 'rosa-rugosa', label: 'Rosa rugosa' },
        ],
      },
      {
        id: 'malus',
        label: 'Malus',
        children: [{ id: 'malus-domestica', label: 'Malus domestica' }],
      },
      { id: 'fragaria', label: 'Fragaria' },
    ],
  },
  {
    id: 'amaryllidaceae',
    label: 'Amaryllidaceae',
    children: [
      { id: 'allium', label: 'Allium', children: [{ id: 'allium-cepa', label: 'Allium cepa' }] },
    ],
  },
  { id: 'incertae', label: 'Incertae sedis', disabled: true },
];

const ids = (list: readonly { node: TreeNode }[]) => list.map((entry) => entry.node.id);

describe('tree-view navigation', () => {
  const visible = visibleTreeNodes(taxa, new Set(['rosaceae', 'rosa']));

  test('flattens expanded parents depth first, with level and position', () => {
    expect(ids(visible)).toEqual([
      'rosaceae',
      'rosa',
      'rosa-canina',
      'rosa-rugosa',
      'malus',
      'fragaria',
      'amaryllidaceae',
      'incertae',
    ]);
    expect(visible[2]).toMatchObject({ level: 3, parentId: 'rosa', setSize: 2, posInSet: 1 });
    expect(visible[4]).toMatchObject({ level: 2, parent: true, expanded: false, posInSet: 2 });
    expect(visible[5]).toMatchObject({ parent: false, expanded: false });
  });

  test('moves next, previous, to the parent and to the first child', () => {
    expect(nextTreeIndex(visible, 0)).toBe(1);
    expect(nextTreeIndex(visible, visible.length - 1)).toBe(visible.length - 1);
    expect(previousTreeIndex(0)).toBe(0);
    expect(parentTreeIndex(visible, 3)).toBe(1);
    expect(parentTreeIndex(visible, 0)).toBe(-1);
    expect(firstChildTreeIndex(visible, 1)).toBe(2);
    // Malus is closed, so it has no visible first child.
    expect(firstChildTreeIndex(visible, 4)).toBe(-1);
  });

  test('typeahead matches label prefixes, wrapping, and cycles on a repeated key', () => {
    expect(typeaheadTreeIndex(visible, 0, 'ma')).toBe(4);
    expect(typeaheadTreeIndex(visible, 0, 'R')).toBe(1);
    expect(typeaheadTreeIndex(visible, 1, 'rr')).toBe(2);
    expect(typeaheadTreeIndex(visible, 7, 'ros')).toBe(0);
    expect(typeaheadTreeIndex(visible, 0, 'zz')).toBe(-1);
  });

  test('* finds the parents among the siblings', () => {
    expect(siblingParentIds(visible, 5)).toEqual(['rosa', 'malus']);
    expect(siblingParentIds(visible, 0)).toEqual(['rosaceae', 'amaryllidaceae']);
  });
});

describe('TreeView', () => {
  test('is a named tree of treeitems with level, set size and position', async () => {
    const screen = await render(TreeView, { nodes: taxa, label: 'Taxa' });

    await expect.element(screen.getByRole('tree', { name: 'Taxa' })).toBeInTheDocument();
    const roots = screen.getByRole('treeitem').all();
    expect(roots).toHaveLength(3);
    for (const [index, root] of roots.entries()) {
      await expect.element(root).toHaveAttribute('aria-level', '1');
      await expect.element(root).toHaveAttribute('aria-setsize', '3');
      await expect.element(root).toHaveAttribute('aria-posinset', String(index + 1));
    }
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosaceae' }))
      .toHaveAttribute('aria-expanded', 'false');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Incertae sedis' }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  test('has exactly one tab stop', async () => {
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      expanded: new SvelteSet(['rosaceae']),
    });

    const stops = screen
      .getByRole('treeitem')
      .elements()
      .filter((item) => item.getAttribute('tabindex') === '0');
    expect(stops).toHaveLength(1);
    expect(stops[0]?.getAttribute('aria-level')).toBe('1');
    expect(screen.getByRole('tree').element().getAttribute('aria-multiselectable')).toBeNull();
  });

  test('the tab stop is the first selected node when none has had focus', async () => {
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      expanded: new SvelteSet(['rosaceae']),
      selected: new SvelteSet(['malus']),
    });

    await userEvent.tab();
    await expect
      .element(screen.getByRole('treeitem', { name: 'Malus', exact: true }))
      .toHaveFocus();
  });

  test('→ expands, → again enters, ← returns to the parent, ← collapses', async () => {
    const screen = await render(TreeView, { nodes: taxa, label: 'Taxa' });
    const rosaceae = screen.getByRole('treeitem', { name: 'Rosaceae' });

    await userEvent.tab();
    await expect.element(rosaceae).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect.element(rosaceae).toHaveAttribute('aria-expanded', 'true');
    await expect.element(screen.getByRole('group')).toBeInTheDocument();
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosa', exact: true }))
      .toHaveAttribute('aria-level', '2');

    await userEvent.keyboard('{ArrowRight}');
    await expect.element(screen.getByRole('treeitem', { name: 'Rosa', exact: true })).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(rosaceae).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(rosaceae).toHaveAttribute('aria-expanded', 'false');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosa', exact: true }))
      .not.toBeInTheDocument();
  });

  test('↓ / ↑ move through the visible order; Home and End jump to its ends', async () => {
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      expanded: new SvelteSet(['rosaceae']),
    });

    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Malus', exact: true }))
      .toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect.element(screen.getByRole('treeitem', { name: 'Rosa', exact: true })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(screen.getByRole('treeitem', { name: 'Incertae sedis' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(screen.getByRole('treeitem', { name: 'Rosaceae' })).toHaveFocus();

    const stops = screen
      .getByRole('treeitem')
      .elements()
      .filter((item) => item.getAttribute('tabindex') === '0');
    expect(stops).toHaveLength(1);
  });

  test('typing "ma" focuses Malus', async () => {
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      expanded: new SvelteSet(['rosaceae']),
    });

    await userEvent.tab();
    await userEvent.keyboard('ma');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Malus', exact: true }))
      .toHaveFocus();
  });

  test('* expands every sibling parent', async () => {
    const expanded = new SvelteSet<string>();
    const screen = await render(TreeView, { nodes: taxa, label: 'Taxa', expanded });

    await userEvent.tab();
    await userEvent.keyboard('*');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Amaryllidaceae' }))
      .toHaveAttribute('aria-expanded', 'true');
    expect([...expanded].toSorted()).toEqual(['amaryllidaceae', 'rosaceae']);
  });

  test('leaves never carry aria-expanded', async () => {
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      expanded: new SvelteSet(['rosaceae', 'rosa']),
    });

    for (const name of ['Rosa canina', 'Rosa rugosa', 'Fragaria', 'Incertae sedis']) {
      expect(screen.getByRole('treeitem', { name }).element().hasAttribute('aria-expanded')).toBe(
        false,
      );
    }
  });

  test('single selection: Enter activates and selects, replacing the previous selection', async () => {
    const selected = new SvelteSet<string>();
    const onActivate = vi.fn<(node: TreeNode) => void>();
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      expanded: new SvelteSet(['rosaceae']),
      selected,
      onActivate,
    });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'rosaceae' }));
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosaceae' }))
      .toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowDown} ');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosa', exact: true }))
      .toHaveAttribute('aria-selected', 'true');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosaceae' }))
      .toHaveAttribute('aria-selected', 'false');
    expect([...selected]).toEqual(['rosa']);
  });

  test('multiple selection: Space toggles nodes into the bound set', async () => {
    const selected = new SvelteSet<string>();
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      selection: 'multiple',
      selected,
    });

    await expect.element(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.tab();
    await userEvent.keyboard(' {ArrowDown} ');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosaceae' }))
      .toHaveAttribute('aria-selected', 'true');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Amaryllidaceae' }))
      .toHaveAttribute('aria-selected', 'true');
    expect([...selected].toSorted()).toEqual(['amaryllidaceae', 'rosaceae']);

    await userEvent.keyboard(' ');
    await expect
      .element(screen.getByRole('treeitem', { name: 'Amaryllidaceae' }))
      .toHaveAttribute('aria-selected', 'false');
    expect([...selected]).toEqual(['rosaceae']);
  });

  test('multiple selection: Shift+↓ extends, Ctrl+A selects every visible enabled node', async () => {
    const selected = new SvelteSet<string>();
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      selection: 'multiple',
      selected,
    });

    await userEvent.tab();
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect.element(screen.getByRole('treeitem', { name: 'Amaryllidaceae' })).toHaveFocus();
    expect([...selected]).toEqual(['amaryllidaceae']);

    await userEvent.keyboard('{Control>}a{/Control}');
    expect([...selected].toSorted()).toEqual(['amaryllidaceae', 'rosaceae']);
    await expect
      .element(screen.getByRole('treeitem', { name: 'Incertae sedis' }))
      .toHaveAttribute('aria-selected', 'false');
  });

  test('a disabled node is focusable but never selected or activated', async () => {
    const onActivate = vi.fn<(node: TreeNode) => void>();
    const screen = await render(TreeView, { nodes: taxa, label: 'Taxa', onActivate });

    await userEvent.tab();
    await userEvent.keyboard('{End}{Enter} ');
    const incertae = screen.getByRole('treeitem', { name: 'Incertae sedis' });
    await expect.element(incertae).toHaveFocus();
    await expect.element(incertae).toHaveAttribute('aria-selected', 'false');
    expect(onActivate).not.toHaveBeenCalled();
  });

  test("selection 'none' writes no aria-selected", async () => {
    const screen = await render(TreeView, { nodes: taxa, label: 'Taxa', selection: 'none' });

    expect(
      screen.getByRole('treeitem', { name: 'Rosaceae' }).element().hasAttribute('aria-selected'),
    ).toBe(false);
  });

  test('a click toggles a parent and activates a leaf', async () => {
    const onActivate = vi.fn<(node: TreeNode) => void>();
    const screen = await render(TreeView, { nodes: taxa, label: 'Taxa', onActivate });

    await screen.getByText('Rosaceae').click();
    await expect
      .element(screen.getByRole('treeitem', { name: 'Rosaceae' }))
      .toHaveAttribute('aria-expanded', 'true');
    await expect.element(screen.getByRole('treeitem', { name: 'Rosaceae' })).toHaveFocus();

    await screen.getByText('Fragaria').click();
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'fragaria' }));
    await expect
      .element(screen.getByRole('treeitem', { name: 'Fragaria' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('loadChildren: busy while loading, then the children', async () => {
    let resolve: ((children: readonly TreeNode[]) => void) | undefined;
    const loadChildren = vi.fn<
      (node: TreeNode, signal: AbortSignal) => Promise<readonly TreeNode[]>
    >(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const screen = await render(TreeView, {
      nodes: [{ id: 'lamiaceae', label: 'Lamiaceae', children: [] }],
      label: 'Taxa',
      loadChildren,
      loadingLabel: 'Fetching',
    });
    const lamiaceae = screen.getByRole('treeitem', { name: 'Lamiaceae' });

    await expect.element(lamiaceae).toHaveAttribute('aria-expanded', 'false');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(lamiaceae).toHaveAttribute('aria-busy', 'true');
    await expect.element(lamiaceae).toHaveAccessibleDescription('Fetching');
    expect(loadChildren).toHaveBeenCalledTimes(1);

    resolve?.([{ id: 'salvia', label: 'Salvia' }]);
    await expect
      .element(screen.getByRole('treeitem', { name: 'Salvia' }))
      .toHaveAttribute('aria-level', '2');
    expect(lamiaceae.element().hasAttribute('aria-busy')).toBe(false);

    // Loaded once: collapsing and expanding again does not refetch.
    await userEvent.keyboard('{ArrowLeft}{ArrowRight}');
    await expect.element(screen.getByRole('treeitem', { name: 'Salvia' })).toBeInTheDocument();
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  test('loadChildren: collapsing before it resolves aborts the signal', async () => {
    let seen: AbortSignal | undefined;
    const loadChildren = vi.fn<
      (node: TreeNode, signal: AbortSignal) => Promise<readonly TreeNode[]>
    >((_node, signal) => {
      seen = signal;
      return new Promise(() => {});
    });
    const screen = await render(TreeView, {
      nodes: [{ id: 'lamiaceae', label: 'Lamiaceae', children: [] }],
      label: 'Taxa',
      loadChildren,
    });
    const lamiaceae = screen.getByRole('treeitem', { name: 'Lamiaceae' });

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(lamiaceae).toHaveAttribute('aria-busy', 'true');
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(lamiaceae).toHaveAttribute('aria-expanded', 'false');
    expect(seen?.aborted).toBe(true);
    expect(lamiaceae.element().hasAttribute('aria-busy')).toBe(false);
  });

  test('spreads native attributes and merges class onto the tree', async () => {
    const screen = await render(TreeView, {
      nodes: taxa,
      label: 'Taxa',
      id: 'taxa',
      class: 'max-h-64',
      'data-testid': 'tree',
    });

    const tree = screen.getByRole('tree');
    await expect.element(tree).toHaveAttribute('id', 'taxa');
    await expect.element(tree).toHaveAttribute('data-testid', 'tree');
    await expect.element(tree).toHaveClass('max-h-64');
  });
});
