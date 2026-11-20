/**
 * `FabMenu` is a disclosure: the toggle's `aria-expanded` reveals a named
 * group of labelled buttons in Tab order, and Escape or focus leaving closes it.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import FabMenuFixture from './fixtures/FabMenuFixture.svelte';

test('the toggle discloses a named group of labelled actions', async () => {
  const screen = await render(FabMenuFixture, { onSelect: () => {} });
  const toggle = screen.getByRole('button', { name: 'Add' });

  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('group').elements()).toHaveLength(0);

  await userEvent.click(toggle);

  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
  const group = screen.getByRole('group', { name: 'Add' });
  await expect.element(group.getByRole('button', { name: 'Planting' })).toBeVisible();
  await expect
    .element(group.getByRole('link', { name: 'Bed' }))
    .toHaveAttribute('href', '/beds/new');
});

test('Tab moves into the open group and keeps it open; Escape closes and returns focus', async () => {
  const screen = await render(FabMenuFixture, { onSelect: () => {} });
  const toggle = screen.getByRole('button', { name: 'Add' });
  await userEvent.click(toggle);

  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Planting' })).toHaveFocus();
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');

  await userEvent.keyboard('{Escape}');
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect.element(toggle).toHaveFocus();
});

test('focus leaving the dial closes it', async () => {
  const screen = await render(FabMenuFixture, { onSelect: () => {} });
  const toggle = screen.getByRole('button', { name: 'Add' });
  await userEvent.click(toggle);

  await userEvent.tab({ shift: true });

  await expect.element(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('choosing an action runs it and closes the dial', async () => {
  const onSelect = vi.fn<(label: string) => void>();
  const screen = await render(FabMenuFixture, { onSelect });
  await userEvent.click(screen.getByRole('button', { name: 'Add' }));

  await userEvent.click(screen.getByRole('button', { name: 'Harvest' }));

  expect(onSelect).toHaveBeenCalledWith('Harvest');
  await expect
    .element(screen.getByRole('button', { name: 'Add' }))
    .toHaveAttribute('aria-expanded', 'false');
});
