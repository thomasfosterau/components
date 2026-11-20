/**
 * `DiffView` must never carry meaning in colour alone: the table is captioned
 * by the summary, each changed line says "Added:" or "Removed:", changed words
 * are `<ins>` / `<del>`, and a collapsed run is a button.
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import DiffView from '../../src/lib/data/DiffView.svelte';

const before = 'Sow basil in spring.\nWater daily.\nHarvest leaves.\n';
const after = 'Sow basil in late spring.\nWater daily.\nHarvest leaves.\nDry the rest.\n';

test('is a table named by its summary', async () => {
  const screen = await render(DiffView, { before, after });

  await expect
    .element(screen.getByRole('table', { name: '2 lines added, 1 removed' }))
    .toBeInTheDocument();
});

test('prefixes changed lines and wraps only the changed words', async () => {
  const screen = await render(DiffView, { before, after });

  const added = screen.getByRole('cell').filter({ hasText: 'Dry the rest.' });
  expect(added.element().textContent?.startsWith('Added:')).toBe(true);
  const removed = screen.getByRole('cell').filter({ hasText: /^Removed:/ });
  await expect.element(removed).toBeInTheDocument();
  const insertions = [...screen.container.querySelectorAll('ins')].map((node) => node.textContent);
  expect(insertions).toEqual(['late ']);
});

test('collapses a long unchanged run and focuses the first line it reveals', async () => {
  const lines = Array.from({ length: 12 }, (_, index) => `line ${index + 1}`);
  const changed = [...lines];
  changed[0] = 'first';
  changed[11] = 'last';
  // `context` is also a Svelte mount option, so the props go under `props`.
  const screen = await render(DiffView, {
    props: { before: lines.join('\n'), after: changed.join('\n'), context: 1 },
  });

  const button = screen.getByRole('button', { name: 'Show 8 unchanged lines' });
  expect(screen.getByText('line 5').elements()).toHaveLength(0);
  await userEvent.click(button);

  await expect.element(screen.getByRole('cell').filter({ hasText: 'line 3' })).toHaveFocus();
  await expect.element(screen.getByText('line 5')).toBeInTheDocument();
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('pairs a modified line on one row in the split layout', async () => {
  const screen = await render(DiffView, { before, after, layout: 'split' });

  await expect.element(screen.getByRole('columnheader', { name: 'Before' })).toBeInTheDocument();
  const row = screen.getByRole('row').filter({ hasText: 'late' });
  await expect.element(row).toHaveTextContent(/Sow basil in spring\..*Sow basil in late spring\./);
});

test('says there are no changes when the texts match', async () => {
  const screen = await render(DiffView, { before, after: before });

  await expect.element(screen.getByText('No changes')).toBeInTheDocument();
  expect(screen.getByRole('table').elements()).toHaveLength(0);
});
