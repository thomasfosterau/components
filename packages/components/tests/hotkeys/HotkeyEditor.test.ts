/** `HotkeyEditor` driving a live registry: rebinding, disabling, resetting, and the single-key switch. */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import HotkeyRebindFixture from './fixtures/HotkeyRebindFixture.svelte';

test('a row per command, its shortcut field named by the command', async () => {
  const screen = await render(HotkeyRebindFixture, { editor: true });
  await expect.element(screen.getByRole('rowheader', { name: 'Search' })).toBeVisible();
  await expect.element(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('Ctrl+K');
  await expect.element(screen.getByRole('textbox', { name: 'Archive' })).toHaveValue('E');
  await expect
    .element(screen.getByRole('textbox', { name: 'Go to posts' }))
    .toHaveValue('G then P');
});

test('rebinding moves the command to the new chord and reports the overrides', async () => {
  const onOverridesChange = vi.fn<(overrides: Readonly<Record<string, string | null>>) => void>();
  const screen = await render(HotkeyRebindFixture, { editor: true, onOverridesChange });
  await screen.getByRole('textbox', { name: 'Search' }).click();
  await userEvent.keyboard('{Control>}j{/Control}');
  expect(onOverridesChange).toHaveBeenLastCalledWith({ search: '$mod+j' });

  await screen.getByRole('button', { name: 'Reset' }).first().click();
  // Focus is off the field now, so the registry dispatches again.
  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(screen.getByTestId('fired')).toHaveTextContent('search');
  expect(onOverridesChange).toHaveBeenLastCalledWith({});
});

test('disable unbinds a command, and the single-key switch silences plain keys', async () => {
  const screen = await render(HotkeyRebindFixture, { editor: true });
  await screen.getByRole('button', { name: 'Disable' }).first().click();
  await expect.element(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('');

  await screen.getByRole('switch', { name: 'Single-key shortcuts' }).click();
  await screen.getByRole('button', { name: 'After' }).click();
  await userEvent.keyboard('e');
  expect(screen.getByTestId('fired').element().textContent).toBe('');
});

test('search filters the rows', async () => {
  const screen = await render(HotkeyRebindFixture, { editor: true });
  await screen.getByRole('searchbox', { name: 'Search commands' }).fill('chiv');
  await expect.element(screen.getByRole('rowheader', { name: 'Archive' })).toBeVisible();
  await expect.element(screen.getByRole('rowheader', { name: 'Search' })).not.toBeInTheDocument();
});
