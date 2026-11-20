/**
 * `Cascader`'s contract: a trigger named by the label showing the path, a
 * dialog of listbox columns named after their parents, → / Enter / ← /
 * Escape, lazy children with an aborted signal on a branch change, search
 * by full path, `selectParents`, the Back button and the posted value.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { CascaderNode } from '../../src/lib/fields/cascader.ts';
import CascaderFixture from './fixtures/CascaderFixture.svelte';

test('the trigger is named by the label and shows the chosen path', async () => {
  const screen = await render(CascaderFixture, {
    value: ['Plantae', 'Solanaceae', 'Solanum lycopersicum'],
  });

  const trigger = screen.getByRole('button', { name: 'Species' });
  await expect.element(trigger).toHaveTextContent('Plantae / Solanaceae / Solanum lycopersicum');
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect.element(trigger).toHaveAccessibleDescription('Drill down to a species.');
});

test('→ opens a branch into a column named after it; Enter on a leaf commits and closes', async () => {
  const screen = await render(CascaderFixture, {});

  const trigger = screen.getByRole('button', { name: 'Species' });
  await trigger.click();
  await expect.element(screen.getByRole('dialog', { name: 'Species' })).toBeVisible();
  const first = screen.getByRole('listbox', { name: 'Species' });
  await expect.element(first).toHaveFocus();

  await userEvent.keyboard('{ArrowRight}');
  const plantae = screen.getByRole('listbox', { name: 'Plantae' });
  await expect.element(plantae).toHaveFocus();
  await expect
    .element(screen.getByRole('option', { name: 'Plantae' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(plantae.getByRole('option', { name: 'Solanaceae' }))
    .toHaveAccessibleDescription('Has subcategories');

  await userEvent.keyboard('{Enter}{ArrowDown}{Enter}');
  await expect
    .element(screen.getByTestId('bound'))
    .toHaveTextContent('Plantae|Solanaceae|Solanum tuberosum');
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test('← returns to the parent column; Escape closes without committing', async () => {
  const screen = await render(CascaderFixture, { value: ['Unsorted'] });

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('{Home}{ArrowRight}');
  await expect.element(screen.getByRole('listbox', { name: 'Plantae' })).toHaveFocus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(screen.getByRole('listbox', { name: 'Species' })).toHaveFocus();

  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Unsorted');
});

test('a disabled branch is skipped and cannot be opened', async () => {
  const screen = await render(CascaderFixture, {});

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Unsorted');
});

test('opening shows the chosen path, its last column focused', async () => {
  const screen = await render(CascaderFixture, {
    value: ['Plantae', 'Rosaceae', 'Malus domestica'],
  });

  await screen.getByRole('button', { name: 'Species' }).click();
  const rosaceae = screen.getByRole('listbox', { name: 'Rosaceae' });
  await expect.element(rosaceae).toHaveFocus();
  await expect
    .element(rosaceae.getByRole('option', { name: 'Malus domestica' }))
    .toHaveAttribute('aria-selected', 'true');
});

const lazy: readonly CascaderNode[] = [
  { value: 'au', label: 'Australia', hasChildren: true },
  { value: 'nz', label: 'New Zealand', hasChildren: true },
];

test('loadChildren: the column is busy, then filled; switching branch aborts the load', async () => {
  const signals: AbortSignal[] = [];
  const resolvers: ((nodes: readonly CascaderNode[]) => void)[] = [];
  const loadChildren = vi.fn<
    (path: readonly string[], signal: AbortSignal) => Promise<readonly CascaderNode[]>
  >(
    async (_path, signal) =>
      new Promise<readonly CascaderNode[]>((resolve) => {
        signals.push(signal);
        resolvers.push(resolve);
      }),
  );
  const screen = await render(CascaderFixture, { options: lazy, loadChildren });

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('{ArrowRight}');
  const australia = screen.getByRole('listbox', { name: 'Australia' });
  await expect.element(australia).toHaveAttribute('aria-busy', 'true');
  expect(loadChildren).toHaveBeenLastCalledWith(['au'], signals[0]);

  await userEvent.keyboard('{ArrowLeft}{ArrowDown}{ArrowRight}');
  expect(signals[0]?.aborted).toBe(true);
  resolvers[1]?.([{ value: 'akl', label: 'Auckland' }]);
  const nz = screen.getByRole('listbox', { name: 'New Zealand' });
  await expect.element(nz).not.toHaveAttribute('aria-busy');
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('nz|akl');
  await expect
    .element(screen.getByRole('button', { name: 'Species' }))
    .toHaveTextContent('New Zealand / Auckland');
});

test('a failed load says so, and opening the branch again retries', async () => {
  const loadChildren = vi
    .fn<(path: readonly string[], signal: AbortSignal) => Promise<readonly CascaderNode[]>>()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([{ value: 'per', label: 'Perth' }]);
  const screen = await render(CascaderFixture, { options: lazy, loadChildren });

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('{ArrowRight}');
  const australia = screen.getByRole('listbox', { name: 'Australia' });
  await expect.element(australia).toHaveTextContent('Could not load');
  await userEvent.keyboard('{ArrowLeft}{ArrowRight}');
  await expect.element(australia.getByRole('option', { name: 'Perth' })).toBeVisible();
});

test('typing moves to the option that starts with it', async () => {
  const screen = await render(CascaderFixture, {});

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('u{Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Unsorted');
});

test('search lists full paths, and Enter commits one', async () => {
  const screen = await render(CascaderFixture, { searchable: true });

  await screen.getByRole('button', { name: 'Species' }).click();
  const search = screen.getByRole('combobox', { name: 'Search' });
  await expect.element(search).toHaveFocus();
  await userEvent.keyboard('lycop');
  await expect
    .element(screen.getByRole('option', { name: 'Plantae, Solanaceae, Solanum lycopersicum' }))
    .toBeVisible();
  await expect.element(search).toHaveAttribute('aria-expanded', 'true');
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByTestId('bound'))
    .toHaveTextContent('Plantae|Solanaceae|Solanum lycopersicum');
});

test('a search callback replaces the in-memory search', async () => {
  const search = vi.fn<
    (query: string, signal: AbortSignal) => Promise<readonly (readonly CascaderNode[])[]>
  >(async () => [
    [
      { value: 'au', label: 'Australia' },
      { value: 'syd', label: 'Sydney' },
    ],
  ]);
  const screen = await render(CascaderFixture, { searchable: true, search });

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('syd');
  await screen.getByRole('option', { name: 'Australia, Sydney' }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('au|syd');
  expect(search.mock.calls[0]?.[1].aborted).toBe(true);
});

test('selectParents: opening a branch chooses it', async () => {
  const screen = await render(CascaderFixture, { selectParents: true });

  await screen.getByRole('button', { name: 'Species' }).click();
  await screen.getByRole('option', { name: 'Plantae' }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Plantae');
  await expect.element(screen.getByRole('listbox', { name: 'Plantae' })).toHaveFocus();
});

test('the Back button returns to the parent column', async () => {
  const screen = await render(CascaderFixture, {});

  await screen.getByRole('button', { name: 'Species' }).click();
  await userEvent.keyboard('{ArrowRight}');
  await screen.getByRole('button', { name: 'Back' }).click();
  await expect.element(screen.getByRole('listbox', { name: 'Species' })).toHaveFocus();
});

test('posts the leaf value, or the whole path with pathSeparator', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const value = ['Plantae', 'Rosaceae', 'Malus domestica'];
  const screen = await render(CascaderFixture, { value, onSubmitted });
  await screen.getByRole('button', { name: 'Save' }).click();
  expect(onSubmitted.mock.calls[0]?.[0].get('species')).toBe('Malus domestica');
  await screen.unmount();

  const joined = await render(CascaderFixture, { value, pathSeparator: '/', onSubmitted });
  await joined.getByRole('button', { name: 'Save' }).click();
  expect(onSubmitted.mock.calls[1]?.[0].get('species')).toBe('Plantae/Rosaceae/Malus domestica');
});
