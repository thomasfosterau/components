import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vite-plus/test/browser/context';
import Tip from '../../src/lib/tips/Tip.svelte';
import { createTipStack } from '../../src/lib/tips/tip-stack.ts';
import { createTipStore, memoryTipStorage } from '../../src/lib/tips/tip-store.svelte.ts';
import type { TipConfig } from '../../src/lib/tips/types.ts';

const tip = (overrides: Partial<TipConfig> = {}): TipConfig => ({
  id: 'welcome',
  title: 'Welcome',
  ...overrides,
});

test('shows a tip the store allows, and records that it did', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip({ message: 'Track what you grow.' });
  store.register(config);

  const screen = await render(Tip, { config, store });
  await expect.element(screen.getByText('Welcome')).toBeInTheDocument();
  await expect.element(screen.getByText('Track what you grow.')).toBeInTheDocument();
  expect(store.getState('welcome').displayCount).toBe(1);
});

test('carries the status role and polite live region', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip();
  store.register(config);

  const screen = await render(Tip, { config, store });
  const status = screen.getByRole('status');
  await expect.element(status).toBeInTheDocument();
  await expect.element(status).toHaveAttribute('aria-live', 'polite');
});

test('renders nothing when the store says no', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip({ rules: [{ id: 'never', evaluate: () => false }] });
  store.register(config);

  const screen = await render(Tip, { config, store });
  await expect.element(screen.getByText('Welcome')).not.toBeInTheDocument();
});

test('dismisses for good, with a default accessible name of "Dismiss"', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip();
  store.register(config);

  const screen = await render(Tip, { config, store });
  await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  await expect.element(screen.getByText('Welcome')).not.toBeInTheDocument();
  expect(store.getState('welcome').status).toBe('dismissed');
});

test('the dismiss button accepts a caller-supplied accessible name', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const config = tip();
  store.register(config);

  const screen = await render(Tip, { config, store, dismissLabel: 'Close this tip' });
  await expect.element(screen.getByRole('button', { name: 'Close this tip' })).toBeInTheDocument();
});

test('COMPLETES rather than dismisses when the reader takes an action', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const handler = vi.fn();
  const config = tip({ actions: [{ id: 'go', title: 'Get started', handler }] });
  store.register(config);

  const screen = await render(Tip, { config, store });
  await userEvent.click(screen.getByRole('button', { name: 'Get started' }));
  expect(handler).toHaveBeenCalledTimes(1);
  expect(store.getState('welcome').status).toBe('completed');
});

test('closes on Escape only when it is the topmost tip', async () => {
  const store = createTipStore({ storage: memoryTipStorage() });
  const stack = createTipStack();
  const config = tip();
  store.register(config);

  const screen = await render(Tip, { config, store, stack });
  await expect.element(screen.getByText('Welcome')).toBeInTheDocument();

  // Another tip appeared after this one, so Escape is not this one's to take.
  stack.push('something-else');
  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByText('Welcome')).toBeInTheDocument();

  stack.pop('something-else');
  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByText('Welcome')).not.toBeInTheDocument();
  expect(store.getState('welcome').status).toBe('dismissed');
});
