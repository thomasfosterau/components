/**
 * `CommandPalette` — the two things it has to get right are the keyboard and
 * the search lifecycle, so both are driven for real: Chromium key presses
 * through `userEvent`, and an `onSearch` that resolves on a timer and honours
 * the abort signal.
 *
 * The first half runs WITH a hotkey registry (⌘K opens it, rows come from
 * `paletteActions`, role gating applies); the second runs with none at all,
 * which is the configuration an app without a hotkey system gets.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { CommandItem } from '../../src/lib/search/types.ts';
import PaletteRegistryFixture from './fixtures/PaletteRegistryFixture.svelte';
import PaletteStandaloneFixture from './fixtures/PaletteStandaloneFixture.svelte';

const ITEMS: readonly CommandItem[] = [
  { id: 'settings', label: 'Open settings', group: 'actions', hint: '/settings' },
  { id: 'profile', label: 'Open profile', group: 'navigation', badge: 'You' },
];

const RESULTS: readonly CommandItem[] = [
  { id: 'rosa-canina', label: 'Rosa canina', group: 'results', badge: 'species' },
  { id: 'rosa-rugosa', label: 'Rosa rugosa', group: 'results', badge: 'species' },
];

/** An `onSearch` that settles after `ms` and rejects when aborted. */
const slowSearch = (ms: number, calls: string[] = []) =>
  vi.fn(
    (query: string, signal: AbortSignal): Promise<readonly CommandItem[]> =>
      new Promise((resolve, reject) => {
        calls.push(query);
        const timer = setTimeout(() => {
          resolve(RESULTS.filter((row) => row.label.toLowerCase().includes(query.toLowerCase())));
        }, ms);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('aborted'));
        });
      }),
  );

// ── With a registry ──────────────────────────────────────────────────

test('$mod+k opens a dialog named by `label`, holding a combobox', async () => {
  const screen = await render(PaletteRegistryFixture);

  expect(screen.getByRole('dialog').elements()).toHaveLength(0);

  await userEvent.keyboard('{Control>}k{/Control}');

  await expect.element(screen.getByRole('dialog')).toHaveAccessibleName('Command palette');
  await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
});

test('`label` is a prop', async () => {
  const screen = await render(PaletteRegistryFixture, { label: 'Palette de commandes' });

  await userEvent.keyboard('{Control>}k{/Control}');

  await expect.element(screen.getByRole('dialog')).toHaveAccessibleName('Palette de commandes');
});

test('it lists the registry’s palette actions under their group headings', async () => {
  const screen = await render(PaletteRegistryFixture);

  await userEvent.keyboard('{Control>}k{/Control}');

  await expect.element(screen.getByText('Actions', { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText('Go to', { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByRole('option', { name: /New post/ })).toBeInTheDocument();
  await expect.element(screen.getByRole('option', { name: /Go to posts/ })).toBeInTheDocument();
  // `paletteVisible: false` keeps the opener itself out of its own list.
  expect(screen.getByRole('option', { name: /Open the command palette/ }).elements()).toHaveLength(
    0,
  );
});

test('a row shows its hotkey, so the palette teaches the keyboard', async () => {
  const screen = await render(PaletteRegistryFixture);

  await userEvent.keyboard('{Control>}k{/Control}');

  const row = screen.getByRole('option', { name: /New post/ }).element();
  expect(row.querySelector('kbd')?.textContent).toBe('C');
});

test('an admin-only action is absent for a non-admin viewer', async () => {
  const screen = await render(PaletteRegistryFixture, { isAdmin: false });

  await userEvent.keyboard('{Control>}k{/Control}');

  await expect.element(screen.getByRole('option', { name: /New post/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Purge the cache/ }).elements()).toHaveLength(0);
});

test('arrow keys move the selection and Enter runs the action, closing the palette', async () => {
  const screen = await render(PaletteRegistryFixture);

  await userEvent.keyboard('{Control>}k{/Control}');
  const input = screen.getByRole('combobox');
  const first = screen.getByRole('option', { name: /New post/ }).element();
  const second = screen.getByRole('option', { name: /Edit post/ }).element();

  // It opens with the cursor in the query box and the first row under it…
  await expect.element(input).toHaveFocus();
  await expect.element(input).toHaveAttribute('aria-activedescendant', first.id);

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(input).toHaveAttribute('aria-activedescendant', second.id);

  await userEvent.keyboard('{Enter}');

  await expect.element(screen.getByTestId('ran')).toHaveTextContent('post.edit');
  await expect.element(screen.getByTestId('palette-open')).toHaveTextContent('closed');
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('Escape closes it, and the registry’s paletteOpen follows', async () => {
  const screen = await render(PaletteRegistryFixture);

  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  await expect.element(screen.getByTestId('palette-open')).toHaveTextContent('closed');
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('typing filters the rows bits-ui owns when there is no onSearch', async () => {
  const screen = await render(PaletteRegistryFixture);

  await userEvent.keyboard('{Control>}k{/Control}');
  await userEvent.fill(screen.getByRole('combobox'), 'edit');

  await expect.element(screen.getByRole('option', { name: /Edit post/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Go to posts/ }).elements()).toHaveLength(0);
});

// ── With no registry ─────────────────────────────────────────────────

test('it opens from the bindable `open` and lists `items`, with no registry above', async () => {
  const screen = await render(PaletteStandaloneFixture, { items: ITEMS });

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));

  await expect.element(screen.getByRole('dialog')).toHaveAccessibleName('Command palette');
  await expect.element(screen.getByRole('option', { name: /Open settings/ })).toBeInTheDocument();
  // The hint and the badge ride along with the row.
  await expect.element(screen.getByText('/settings')).toBeInTheDocument();
  await expect.element(screen.getByText('You')).toBeInTheDocument();
});

test('selecting a row reports it and closes, writing `open` back', async () => {
  const screen = await render(PaletteStandaloneFixture, { items: ITEMS });

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));
  await userEvent.click(screen.getByRole('option', { name: /Open settings/ }));

  await expect.element(screen.getByTestId('selected')).toHaveTextContent('settings');
  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
});

test('an async search shows the loading row, then the results', async () => {
  const onSearch = slowSearch(60);
  const screen = await render(PaletteStandaloneFixture, { items: ITEMS, onSearch });

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));
  await userEvent.fill(screen.getByRole('combobox'), 'rosa');

  // Named by `loadingLabel`, so the wait is announced rather than silent.
  await expect.element(screen.getByRole('progressbar', { name: 'Searching…' })).toBeInTheDocument();

  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();
  await expect.element(screen.getByText('Results')).toBeInTheDocument();
  expect(screen.getByRole('progressbar').elements()).toHaveLength(0);

  // The local rows are filtered against the same query, so they do not
  // outlive it.
  expect(screen.getByRole('option', { name: /Open settings/ }).elements()).toHaveLength(0);
});

test('a superseded search is aborted, and only the latest query is shown', async () => {
  const calls: string[] = [];
  const onSearch = slowSearch(40, calls);
  const screen = await render(PaletteStandaloneFixture, { items: ITEMS, onSearch, debounceMs: 5 });

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));
  const input = screen.getByRole('combobox');
  await userEvent.fill(input, 'rosa c');
  await userEvent.fill(input, 'rosa rug');

  await expect.element(screen.getByRole('option', { name: /Rosa rugosa/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Rosa canina/ }).elements()).toHaveLength(0);
  expect(calls.at(-1)).toBe('rosa rug');
});

test('a settled query that matched nothing says so', async () => {
  const onSearch = slowSearch(10);
  const screen = await render(PaletteStandaloneFixture, { items: ITEMS, onSearch });

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));
  await userEvent.fill(screen.getByRole('combobox'), 'zzzz');

  await expect.element(screen.getByText('No results')).toBeInTheDocument();
});

test('closing clears the query, so it does not reopen on yesterday’s search', async () => {
  const onSearch = slowSearch(10);
  const screen = await render(PaletteStandaloneFixture, { items: ITEMS, onSearch });

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));
  await userEvent.fill(screen.getByRole('combobox'), 'rosa');
  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');

  await userEvent.click(screen.getByRole('button', { name: 'Open the palette' }));
  await expect.element(screen.getByRole('combobox')).toHaveValue('');
  await expect.element(screen.getByRole('option', { name: /Open settings/ })).toBeInTheDocument();
});
