/**
 * `Drawer` — Dialog's modal contract at an edge: named dialog, focus moved
 * in and trapped, Escape returns focus, `start` follows the writing
 * direction, `hideTitle` keeps the name.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import DrawerFixture from './fixtures/DrawerFixture.svelte';

afterEach(() => {
  document.documentElement.dir = '';
});

test('the trigger opens a named modal dialog with focus inside, and Tab stays in it', async () => {
  const screen = await render(DrawerFixture, {});

  await screen.getByRole('button', { name: 'Filters' }).click();
  const dialog = page.getByRole('dialog', { name: 'Filters' });
  await expect.element(dialog).toHaveAttribute('aria-modal', 'true');
  await expect.element(dialog).toHaveAccessibleDescription('Narrow the plant list.');
  const panel = dialog.element();
  expect(panel.contains(document.activeElement)).toBe(true);
  for (let step = 0; step < 6; step += 1) {
    await userEvent.tab();
    expect(panel.contains(document.activeElement)).toBe(true);
  }
});

test('Escape closes it and returns focus to the trigger', async () => {
  const screen = await render(DrawerFixture, {});

  const trigger = screen.getByRole('button', { name: 'Filters' });
  await trigger.click();
  await expect.element(page.getByRole('dialog')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test('actions({ close }) closes it', async () => {
  const screen = await render(DrawerFixture, {});

  await screen.getByRole('button', { name: 'Filters' }).click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect.element(screen.getByTestId('open')).toHaveTextContent('false');
});

test('side="start" sits at the inline start, and flips under RTL', async () => {
  const ltr = await render(DrawerFixture, { side: 'start' });
  await ltr.getByRole('button', { name: 'Filters' }).click();
  expect(Math.round(page.getByRole('dialog').element().getBoundingClientRect().left)).toBe(0);
  await userEvent.keyboard('{Escape}');
  ltr.unmount();

  document.documentElement.dir = 'rtl';
  const rtl = await render(DrawerFixture, { side: 'start' });
  await rtl.getByRole('button', { name: 'Filters' }).click();
  const box = page.getByRole('dialog').element().getBoundingClientRect();
  expect(Math.round(box.right)).toBe(window.innerWidth);
});

test('hideTitle: the dialog keeps its name; the heading is not visible', async () => {
  const screen = await render(DrawerFixture, { hideTitle: true });

  await screen.getByRole('button', { name: 'Filters' }).click();
  await expect.element(page.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  const heading = page.getByRole('dialog').getByRole('heading', { name: 'Filters' }).element();
  expect(heading.classList.contains('sr-only')).toBe(true);
});
