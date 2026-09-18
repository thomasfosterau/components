import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from '@vitest/browser/context';
import { createRawSnippet } from 'svelte';
import PopoverTip from '../../src/lib/tips/PopoverTip.svelte';
import { createTipStack } from '../../src/lib/tips/tip-stack.ts';
import { createTipStore, memoryTipStorage } from '../../src/lib/tips/tip-store.svelte.ts';
import type { TipConfig } from '../../src/lib/tips/types.ts';

const trigger = (label: string) =>
  createRawSnippet(() => ({
    render: () => `<button type="button">${label}</button>`,
  }));

const tip = (overrides: Partial<TipConfig> = {}): TipConfig => ({
  id: 'story-search',
  title: 'Search across everything',
  ...overrides,
});

test('shows its tip anchored to the trigger, automatically', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip();
  store.register(config);

  const screen = await render(PopoverTip, { config, store, children: trigger('Search') });
  await expect.element(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  await expect.element(screen.getByText('Search across everything')).toBeInTheDocument();
});

test('renders no bubble at all when the store rules never allow it', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip({ rules: [{ id: 'never', evaluate: () => false }] });
  store.register(config);

  const screen = await render(PopoverTip, { config, store, children: trigger('Search') });
  await expect.element(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  await expect.element(screen.getByText('Search across everything')).not.toBeInTheDocument();
});

test('clicking the trigger does not toggle the tip open by itself', async () => {
  // Regression guard: the trigger is an anchor, not a toggle — a tip must
  // never pop open from a click before the store has decided to show it.
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip({ rules: [{ id: 'never', evaluate: () => false }] });
  store.register(config);

  const screen = await render(PopoverTip, { config, store, children: trigger('Search') });
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
  await expect.element(screen.getByText('Search across everything')).not.toBeInTheDocument();
});

test('dismisses for good on Escape', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip();
  store.register(config);

  const screen = await render(PopoverTip, { config, store, children: trigger('Search') });
  await expect.element(screen.getByText('Search across everything')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByText('Search across everything')).not.toBeInTheDocument();
  expect(store.getState('story-search').status).toBe('dismissed');
});

test('Escape closes only the topmost of two tips sharing a stack', async () => {
  const search = tip({ id: 'search' });
  const filters = tip({ id: 'filters', title: 'Narrow it down' });
  const store = createTipStore({ storage: memoryTipStorage() });
  store.register(search);
  store.register(filters);
  const stack = createTipStack();

  const screen = await render(PopoverTip, {
    config: search,
    store,
    stack,
    children: trigger('Search'),
  });
  // A second tip, sharing the same stack, mounted after the first.
  await render(PopoverTip, { config: filters, store, stack, children: trigger('Filters') });

  await expect.element(screen.getByText('Search across everything')).toBeInTheDocument();
  await expect.element(screen.getByText('Narrow it down')).toBeInTheDocument();

  // The second (filters) tip is topmost, so Escape closes it, not the first.
  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByText('Search across everything')).toBeInTheDocument();
  await expect.element(screen.getByText('Narrow it down')).not.toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByText('Search across everything')).not.toBeInTheDocument();
});
