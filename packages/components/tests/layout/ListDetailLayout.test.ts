/**
 * `ListDetailLayout`: two labelled regions; the route's `showDetail` picks
 * the compact pane (by classes the suite cannot render, since it runs
 * without the Tailwind build, so they are pinned here); a compact Back link
 * through the context; and focus that follows a compact navigation in both
 * directions, but stays put from the breakpoint up.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ListDetailFixture from './fixtures/ListDetailFixture.svelte';

afterEach(async () => {
  await page.viewport(1280, 800);
});

test('two labelled regions, and the placeholder while nothing is selected', async () => {
  const screen = await render(ListDetailFixture, {});

  await expect.element(screen.getByRole('region', { name: 'List' })).toBeInTheDocument();
  await expect.element(screen.getByRole('region', { name: 'Details' })).toBeInTheDocument();
  await expect.element(screen.getByText('Choose a bed.')).toBeInTheDocument();
});

test('the compact pane follows showDetail', async () => {
  const list = await render(ListDetailFixture, { showDetail: false });
  await expect.element(list.getByRole('region', { name: 'List' })).toHaveClass('flex');
  await expect.element(list.getByRole('region', { name: 'Details' })).toHaveClass('hidden');
  await list.unmount();

  const detail = await render(ListDetailFixture, { showDetail: true });
  await expect.element(detail.getByRole('region', { name: 'List' })).toHaveClass('hidden');
  await expect.element(detail.getByRole('region', { name: 'Details' })).toHaveClass('flex');
  await expect.element(detail.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/beds');
});

test('on a compact screen, opening focuses the detail and Back focuses the item', async () => {
  await page.viewport(390, 800);
  const screen = await render(ListDetailFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  await expect.element(screen.getByRole('region', { name: 'Details' })).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  await expect.element(screen.getByRole('link', { name: 'Bed 4' })).toHaveFocus();
});

test('on a wide screen, selecting moves no focus', async () => {
  await page.viewport(1280, 800);
  const screen = await render(ListDetailFixture, {});

  const toggle = screen.getByRole('button', { name: 'Toggle' });
  await userEvent.click(toggle);
  await expect.element(toggle).toHaveFocus();
});
