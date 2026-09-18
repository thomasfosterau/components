/**
 * `TreeListItem` is a plain `<li>` — its whole job is the connector rule that
 * makes the nesting readable, and that rule must stop at the last child or a
 * tree reads as a stack of indented rows.
 */

import { createRawSnippet } from 'svelte';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TreeListItem from '../../src/lib/data/TreeListItem.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>Rosa canina</span>' }));

test('is a list item carrying its content', async () => {
  const screen = await render(TreeListItem, { children, 'data-testid': 'leaf' });

  const item = screen.getByTestId('leaf');
  expect(item.element().tagName).toBe('LI');
  await expect.element(screen.getByText('Rosa canina')).toBeInTheDocument();
});

test('draws the connector, and stops it at the last child', async () => {
  const screen = await render(TreeListItem, { children, 'data-testid': 'leaf' });

  const item = screen.getByTestId('leaf');
  await expect.element(item).toHaveClass('border-l-2');
  await expect.element(item).toHaveClass('last:border-transparent');
});

test('merges the caller’s class last and spreads native attributes', async () => {
  const screen = await render(TreeListItem, {
    children,
    class: 'pl-6',
    id: 'rosa-canina',
    'data-testid': 'leaf',
  });

  const item = screen.getByTestId('leaf');
  await expect.element(item).toHaveClass('pl-6');
  await expect.element(item).toHaveAttribute('id', 'rosa-canina');
});
