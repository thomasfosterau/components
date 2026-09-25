import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Skeleton from '../../src/lib/ui/Skeleton.svelte';

test('is a busy status region named by its label', async () => {
  const screen = await render(Skeleton, { label: 'Loading description' });

  const status = screen.getByRole('status');
  await expect.element(status).toHaveAttribute('aria-busy', 'true');
  await expect.element(status).toHaveAccessibleName('Loading description');
});

test('the label is the only thing announced — the shimmer is hidden', async () => {
  const screen = await render(Skeleton, { variant: 'text', lines: 3, 'data-testid': 'skeleton' });

  const hidden = screen.getByTestId('skeleton').element().querySelectorAll('[aria-hidden="true"]');
  expect(hidden.length).toBeGreaterThan(0);
  await expect.element(screen.getByRole('status')).toHaveAccessibleName('Loading');
});

test('the text variant renders one row per line', async () => {
  const screen = await render(Skeleton, { variant: 'text', lines: 4, 'data-testid': 'skeleton' });

  expect(screen.getByTestId('skeleton').element().querySelectorAll('.skeleton')).toHaveLength(4);
});

test('lines below one still renders a single row', async () => {
  const screen = await render(Skeleton, { variant: 'text', lines: 0, 'data-testid': 'skeleton' });

  expect(screen.getByTestId('skeleton').element().querySelectorAll('.skeleton')).toHaveLength(1);
});
