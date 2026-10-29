/**
 * `AppShell` — a standing column from `lg` up, a navigation drawer below
 * it, and exactly one `navigation` landmark in the tree at every width.
 */

import { page } from 'vite-plus/test/browser';
import { afterEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import AppShellFixture from './fixtures/AppShellFixture.svelte';

afterEach(async () => {
  await page.viewport(1280, 800);
});

test('at 1280px: one navigation landmark, no menu button, no dialog', async () => {
  await page.viewport(1280, 800);
  const screen = await render(AppShellFixture, {});

  expect(screen.getByRole('navigation').elements()).toHaveLength(1);
  await expect.element(screen.getByRole('link', { name: 'Beds' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Menu' }).elements()).toHaveLength(0);
  expect(page.getByRole('dialog').elements()).toHaveLength(0);
});

test('at 375px: the menu button opens a "Navigation" drawer holding the same links', async () => {
  await page.viewport(375, 700);
  const screen = await render(AppShellFixture, {});

  expect(screen.getByRole('navigation').elements()).toHaveLength(0);
  await screen.getByRole('button', { name: 'Menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Navigation' });
  await expect.element(drawer).toBeVisible();
  await expect.element(drawer.getByRole('link', { name: 'Plants' })).toBeVisible();
  expect(page.getByRole('navigation').elements()).toHaveLength(1);
});
