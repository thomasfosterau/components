/**
 * `TreeSelect` is a select-only combobox over a tree: single choice by
 * keyboard, a checkbox tree with mixed parents when `multiple`, a filter that
 * keeps ancestors and announces its count, and a form value.
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import TreeSelectFixture from './fixtures/TreeSelectFixture.svelte';

test('the trigger is a combobox that opens a tree', async () => {
  const screen = await render(TreeSelectFixture, {});
  const trigger = screen.getByRole('combobox');

  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'tree');
  await userEvent.click(trigger);

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByRole('tree')).toBeInTheDocument();
});

test('picks one node by keyboard and closes', async () => {
  const screen = await render(TreeSelectFixture, { searchable: false });
  await userEvent.click(screen.getByRole('combobox'));
  await expect.element(screen.getByRole('treeitem', { name: 'Zone A' })).toHaveFocus();

  await userEvent.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');

  await expect.element(screen.getByTestId('value')).toHaveTextContent('bed-3');
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Bed 3');
  expect(screen.getByRole('tree').elements()).toHaveLength(0);
});

test('with leavesOnly, a parent cannot be picked', async () => {
  const screen = await render(TreeSelectFixture, { searchable: false, leavesOnly: true });
  await userEvent.click(screen.getByRole('combobox'));

  await userEvent.keyboard(' ');

  await expect
    .element(screen.getByRole('treeitem', { name: 'Zone A' }))
    .toHaveAttribute('aria-disabled', 'true');
  await expect.element(screen.getByTestId('value')).toHaveTextContent('');
});

test('multiple: checking a parent checks its leaves, and unchecking one makes it mixed', async () => {
  const screen = await render(TreeSelectFixture, { multiple: true, searchable: false });
  await userEvent.click(screen.getByRole('combobox'));
  const zone = screen.getByRole('treeitem', { name: 'Zone A' });

  await userEvent.keyboard(' ');
  await expect.element(zone).toHaveAttribute('aria-checked', 'true');
  await expect.element(screen.getByTestId('values')).toHaveTextContent('zone-a');
  await expect.element(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');

  await userEvent.keyboard('{ArrowRight}{ArrowDown} ');
  await expect.element(zone).toHaveAttribute('aria-checked', 'mixed');
  await expect.element(screen.getByTestId('values')).toHaveTextContent('bed-2,bed-3');
});

test('reports a whole subtree by its leaves under strategy="leaf"', async () => {
  const screen = await render(TreeSelectFixture, {
    multiple: true,
    searchable: false,
    strategy: 'leaf',
  });
  await userEvent.click(screen.getByRole('combobox'));

  await userEvent.keyboard(' ');

  await expect.element(screen.getByTestId('values')).toHaveTextContent('bed-1,bed-2,bed-3');
});

test('filters to matches and their ancestors, announcing the count', async () => {
  const screen = await render(TreeSelectFixture, {});
  await userEvent.click(screen.getByRole('combobox'));

  await userEvent.keyboard('bed 3');

  await expect.element(screen.getByText('1 match')).toHaveAttribute('role', 'status');
  await expect.element(screen.getByRole('treeitem', { name: 'Bed 3' })).toBeInTheDocument();
  expect(screen.getByRole('treeitem').elements()).toHaveLength(2);

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('treeitem', { name: 'Zone A' })).toHaveFocus();
});

test('posts the value and clears it', async () => {
  const screen = await render(TreeSelectFixture, { multiple: true, values: ['bed-1', 'zone-b'] });
  const form = screen.getByTestId('form').element();
  if (!(form instanceof HTMLFormElement)) throw new Error('no form');

  expect(new FormData(form).getAll('beds')).toEqual(['bed-1', 'zone-b']);
  await expect.element(screen.getByRole('combobox')).toHaveTextContent('Bed 1, Zone B');

  await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  expect(new FormData(form).getAll('beds')).toEqual([]);
});
