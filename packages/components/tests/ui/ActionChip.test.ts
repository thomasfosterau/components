/**
 * `ActionChip` is a preset: an assist or suggestion chip is a native button
 * (a link with `href`), a filter chip an `aria-pressed` toggle whose check
 * shows when on and whose name never changes. `ChipGroup` names the set
 * without a roving tab stop.
 */

import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import ActionChipFixture from './fixtures/ActionChipFixture.svelte';

test('a filter chip toggles aria-pressed, binds selected and shows a check', async () => {
  await render(ActionChipFixture);
  const group = page.getByRole('group', { name: 'Plant type' });
  const annuals = group.getByRole('button', { name: 'Annuals', pressed: false });
  await expect.element(annuals).toBeVisible();
  expect(annuals.element().querySelector('svg')).toBeNull();

  await annuals.click();
  const on = group.getByRole('button', { name: 'Annuals', pressed: true });
  await expect.element(on).toBeVisible();
  await expect.element(page.getByTestId('annuals')).toHaveTextContent('true');
  expect(on.element().querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  await expect
    .element(group.getByRole('button', { name: 'Perennials', pressed: true }))
    .toBeVisible();
});

test('an assist chip with href is a link resolved through the context; without, a button', async () => {
  await render(ActionChipFixture);
  const directions = page.getByRole('link', { name: 'Directions' });
  await expect.element(directions).toHaveAttribute('href', '/base/directions');
  await page.getByRole('button', { name: 'Share' }).click();
  await expect.element(page.getByTestId('reply')).toHaveTextContent('shared');
  await expect.element(directions).toHaveClass(/rounded-full/u);
});

test('a suggestion chip is a button named by its text', async () => {
  await render(ActionChipFixture);
  const suggestion = page.getByRole('button', { name: 'Did you mean Solanum?' });
  await expect.element(suggestion).not.toHaveAttribute('aria-pressed');
  await suggestion.click();
  await expect.element(page.getByTestId('reply')).toHaveTextContent('Solanum');
});

test('every chip is its own Tab stop, in reading order', async () => {
  await render(ActionChipFixture);
  const order = ['Annuals', 'Perennials', 'Directions', 'Share', 'Did you mean Solanum?'];
  for (const name of order) {
    await userEvent.tab();
    expect(document.activeElement?.textContent?.trim()).toBe(name);
  }
});
