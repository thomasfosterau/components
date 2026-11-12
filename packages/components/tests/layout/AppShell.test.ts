/**
 * `AppShell` — a standing column from `lg` up, a navigation drawer below
 * it, and exactly one `navigation` landmark in the tree at every width.
 * Given `destinations`, a bottom bar, a rail or a sidebar by width, with the
 * same one-landmark rule.
 */

import { page } from 'vite-plus/test/browser';
import { afterEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import AppShellAdaptiveFixture from './fixtures/AppShellAdaptiveFixture.svelte';
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

// Adaptive mode: one list of destinations, three renderings by width, and
// still exactly one "Primary" navigation landmark in the tree at each.

/** The hrefs of the links inside the one navigation landmark. */
const navHrefs = (): (string | null)[] =>
  page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link')
    .elements()
    .map((link) => link.getAttribute('href'));

test('adaptive at 390px: a bottom bar without the compact: false destinations', async () => {
  await page.viewport(390, 800);
  await render(AppShellAdaptiveFixture, {});

  await expect.poll(() => page.getByRole('navigation').elements().length).toBe(1);
  await expect.element(page.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  expect(navHrefs()).toEqual(['/beds', '/plants', '/inbox']);
  await expect.element(page.getByRole('link', { name: 'Inbox 2 new' })).toBeVisible();
  await expect
    .element(page.getByRole('link', { name: 'Beds' }))
    .toHaveAttribute('aria-current', 'page');
  expect(page.getByRole('button', { name: 'Menu' }).elements()).toHaveLength(0);
});

test('adaptive at 800px: the rail, with every destination and the brand', async () => {
  await page.viewport(800, 800);
  await render(AppShellAdaptiveFixture, {});

  await expect.poll(() => page.getByRole('navigation').elements().length).toBe(1);
  expect(navHrefs()).toEqual(['/beds', '/plants', '/inbox', '/settings']);
  await expect.element(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect.element(page.getByRole('link', { name: 'Garden' })).toBeVisible();
  await expect
    .element(page.getByRole('link', { name: 'Beds' }))
    .toHaveAttribute('aria-current', 'page');
});

test('adaptive at 1280px: the sidebar built from the destinations', async () => {
  await page.viewport(1280, 800);
  await render(AppShellAdaptiveFixture, {});

  await expect.poll(() => page.getByRole('navigation').elements().length).toBe(1);
  expect(navHrefs()).toEqual(['/beds', '/plants', '/inbox', '/settings']);
  const beds = page.getByRole('link', { name: 'Beds' });
  await expect.element(beds).toBeVisible();
  await expect.element(beds).toHaveAttribute('aria-current', 'page');
  await expect.element(beds).toHaveClass('menu-active');
  await expect.element(page.getByRole('link', { name: 'Inbox 2 new' })).toBeVisible();
});
