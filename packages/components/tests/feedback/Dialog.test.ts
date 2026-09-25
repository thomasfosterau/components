/**
 * `Dialog` — the modal contract that is bits-ui's, asserted here because it is
 * what a call site is promised: a named and described `dialog`, a focus trap,
 * Escape, and focus back on the trigger afterwards. Real key presses in
 * Chromium; a DOM shim models none of this faithfully.
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import DialogFixture from './fixtures/DialogFixture.svelte';

test('starts closed, rendering only the trigger', async () => {
  const screen = await render(DialogFixture);

  await expect.element(screen.getByRole('button', { name: 'Move plant' })).toBeInTheDocument();
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
});

test('the trigger opens a dialog named by the title and described by the description', async () => {
  const screen = await render(DialogFixture);

  await userEvent.click(screen.getByRole('button', { name: 'Move plant' }));

  const dialog = screen.getByRole('dialog');
  await expect.element(dialog).toHaveAccessibleName('Move this plant?');
  await expect.element(dialog).toHaveAccessibleDescription('It keeps its history.');
  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('open');

  // The name and the description are RELATIONSHIPS, not copies of the text:
  // the ids point at the rendered title and description elements.
  const element = dialog.element();
  const labelledBy = element.getAttribute('aria-labelledby');
  const describedBy = element.getAttribute('aria-describedby');
  expect(labelledBy).not.toBeNull();
  expect(describedBy).not.toBeNull();
  expect(document.getElementById(labelledBy ?? '')).toHaveTextContent('Move this plant?');
  expect(document.getElementById(describedBy ?? '')).toHaveTextContent('It keeps its history.');
});

test('Tab cycles within the dialog and never escapes it', async () => {
  const screen = await render(DialogFixture);

  await userEvent.click(screen.getByRole('button', { name: 'Move plant' }));
  const dialog = screen.getByRole('dialog').element();

  for (let press = 0; press < 6; press += 1) {
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  }
});

test('Escape closes it and returns focus to the trigger', async () => {
  const screen = await render(DialogFixture);

  const trigger = screen.getByRole('button', { name: 'Move plant' });
  await userEvent.click(trigger);
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
  await expect.element(trigger).toHaveFocus();
});

test('the actions snippet closes through its close callback', async () => {
  const screen = await render(DialogFixture);

  await userEvent.click(screen.getByRole('button', { name: 'Move plant' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('the corner close button is labelled, and its label is a prop', async () => {
  const screen = await render(DialogFixture, { closeLabel: 'Close the mover' });

  await userEvent.click(screen.getByRole('button', { name: 'Move plant' }));
  await userEvent.click(screen.getByRole('button', { name: 'Close the mover' }));

  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('opens from a bound `open`, and carries no description when given none', async () => {
  const screen = await render(DialogFixture, { open: true, withDescription: false });

  const dialog = screen.getByRole('dialog');
  await expect.element(dialog).toHaveAccessibleName('Move this plant?');
  expect(dialog.element().getAttribute('aria-describedby')).toBeNull();
});
