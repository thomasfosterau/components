/**
 * `SupportingPane`: a named `complementary` column with an `aria-expanded`
 * toggle on wide screens, and a `Drawer` dialog with focus return on narrow
 * ones.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SupportingPaneFixture from './fixtures/SupportingPaneFixture.svelte';

afterEach(async () => {
  await page.viewport(1280, 800);
});

test('wide: the toggle opens a complementary column named by its title', async () => {
  await page.viewport(1280, 800);
  const screen = await render(SupportingPaneFixture, {});

  const toggle = screen.getByRole('button', { name: 'Properties' });
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);

  const panel = screen.getByRole('complementary', { name: 'Properties' });
  await expect.element(panel).toHaveTextContent('Bed 4 is 2 × 1.2 m.');
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.element(toggle).toHaveAttribute('aria-controls', panel.element().id);
  expect(page.getByRole('dialog').elements()).toHaveLength(0);

  await userEvent.click(toggle);
  expect(screen.getByRole('complementary').elements()).toHaveLength(0);
  await expect.element(toggle).toHaveFocus();
});

test('narrow: the toggle opens a drawer, and Escape returns focus to it', async () => {
  await page.viewport(390, 800);
  const screen = await render(SupportingPaneFixture, {});

  const toggle = screen.getByRole('button', { name: 'Properties', exact: true });
  await userEvent.click(toggle);
  const dialog = page.getByRole('dialog', { name: 'Properties' });
  await expect.element(dialog).toBeVisible();
  await expect.element(dialog).toHaveTextContent('Bed 4 is 2 × 1.2 m.');

  await userEvent.keyboard('{Escape}');
  expect(page.getByRole('dialog').elements()).toHaveLength(0);
  await expect.element(toggle).toHaveFocus();
});
