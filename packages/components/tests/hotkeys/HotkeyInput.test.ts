/**
 * `HotkeyInput` with real key presses. `$mod` is Ctrl in the session's
 * Chromium (Linux), so the spoken form says "Control".
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import HotkeyRebindFixture from './fixtures/HotkeyRebindFixture.svelte';

const field = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole('textbox', { name: 'Shortcut' });

test('records a chord in registry syntax and describes it in words', async () => {
  const screen = await render(HotkeyRebindFixture);
  await field(screen).click();
  await userEvent.keyboard('{Control>}{Shift>}j{/Shift}{/Control}');

  await expect.element(screen.getByTestId('value')).toHaveTextContent('$mod+shift+j');
  await expect.element(field(screen)).toHaveValue('Ctrl+Shift+J');
  await expect.element(field(screen)).toHaveAccessibleDescription(/Control Shift J/);
});

test('Tab moves on without recording, and Backspace clears', async () => {
  const screen = await render(HotkeyRebindFixture);
  await field(screen).click();
  await userEvent.keyboard('{Control>}j{/Control}');
  await expect.element(screen.getByTestId('value')).toHaveTextContent('$mod+j');

  await userEvent.keyboard('{Backspace}');
  await expect.element(screen.getByTestId('value')).toHaveTextContent('');

  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  await expect.element(screen.getByTestId('value')).toHaveTextContent('');
});

test('refuses a key without a modifier, and Escape drops the refusal', async () => {
  const screen = await render(HotkeyRebindFixture);
  await field(screen).click();
  await userEvent.keyboard('j');

  await expect.element(field(screen)).toHaveAttribute('aria-invalid', 'true');
  await expect.element(field(screen)).toHaveAccessibleDescription(/Include Ctrl, ⌘ or Alt/);
  await expect.element(screen.getByTestId('value')).toHaveTextContent('');

  await userEvent.keyboard('{Escape}');
  await expect.element(field(screen)).not.toHaveAttribute('aria-invalid');
});

test('records a single key when no modifier is required', async () => {
  const screen = await render(HotkeyRebindFixture, { requireModifier: false });
  await field(screen).click();
  await userEvent.keyboard('j');
  await expect.element(screen.getByTestId('value')).toHaveTextContent('j');
});

test('refuses a browser shortcut', async () => {
  const screen = await render(HotkeyRebindFixture);
  await field(screen).click();
  await userEvent.keyboard('{Control>}w{/Control}');
  await expect.element(screen.getByText('That shortcut belongs to the browser')).toBeVisible();
  await expect.element(screen.getByTestId('value')).toHaveTextContent('');
});

test('pauses the registry while recording, so the chord does not fire', async () => {
  const screen = await render(HotkeyRebindFixture);
  await field(screen).click();
  await userEvent.keyboard('{Control>}k{/Control}');

  // Search holds $mod+k: recording it is refused as a clash, and Search did not run.
  await expect.element(screen.getByText(/Already used by Search/)).toBeVisible();
  await expect.element(screen.getByTestId('fired')).toHaveTextContent('');

  await screen.getByRole('button', { name: 'After' }).click();
  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(screen.getByTestId('fired')).toHaveTextContent('search');
});

test('Replace takes a chord from the command that held it', async () => {
  const screen = await render(HotkeyRebindFixture);
  await field(screen).click();
  await userEvent.keyboard('{Control>}k{/Control}');
  await screen.getByRole('button', { name: 'Replace' }).click();

  await expect.element(screen.getByTestId('value')).toHaveTextContent('$mod+k');
  await screen.getByRole('button', { name: 'After' }).click();
  await userEvent.keyboard('{Control>}k{/Control}');
  expect(screen.getByTestId('fired').element().textContent).toBe('');
});
