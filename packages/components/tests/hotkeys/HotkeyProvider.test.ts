/**
 * `HotkeyProvider` — the key router, driven with REAL key presses in Chromium
 * (`userEvent.keyboard`), which is the only way to exercise the thing it is
 * actually about: `KeyboardEvent.key`, the modifier flags, and where focus
 * happens to be.
 *
 * `$mod` resolves to Ctrl here, because the session's Chromium reports a Linux
 * platform. The ⌘ half of that rule is covered by `match.test.ts`, which can
 * stub `navigator.platform`; what this file pins is the routing around it.
 */

import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import HotkeyAppFixture from './fixtures/HotkeyAppFixture.svelte';

/** Ids of the actions that have fired, in order. */
const fired = (screen: Awaited<ReturnType<typeof render>>): string[] =>
  screen
    .getByTestId('fired-id')
    .elements()
    .map((element) => element.textContent ?? '');

test('a plain key fires the page action registered for it', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('e');

  await expect.element(screen.getByTestId('fired')).toHaveTextContent('post.edit');
});

test('a sequence fires only once both keys have been pressed in order', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('g');
  expect(fired(screen)).toEqual([]);

  await userEvent.keyboard('p');
  await expect.element(screen.getByTestId('fired')).toHaveTextContent('nav.posts');
});

test('a sequence that goes nowhere fires nothing, and does not strand the buffer', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('gz');
  expect(fired(screen)).toEqual([]);

  // The stray prefix must not swallow the next trigger.
  await userEvent.keyboard('e');
  await expect.element(screen.getByTestId('fired')).toHaveTextContent('post.edit');
});

test('a $mod chord fires its action', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('{Control>}k{/Control}');

  await expect.element(screen.getByTestId('palette-open')).toHaveTextContent('open');
  expect(fired(screen)).toEqual(['palette.toggle']);
});

test('typing in a field fires nothing — except an allowInEditable action', async () => {
  const screen = await render(HotkeyAppFixture);

  const input = screen.getByRole('textbox', { name: 'Note' });
  await userEvent.click(input);
  await userEvent.keyboard('edge');

  await expect.element(input).toHaveValue('edge');
  expect(fired(screen)).toEqual([]);

  // The palette opener is the one action allowed to fire while typing.
  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(screen.getByTestId('fired')).toHaveTextContent('palette.toggle');
});

test('an open palette suppresses everything but the allowInEditable actions', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(screen.getByTestId('palette-open')).toHaveTextContent('open');

  await userEvent.keyboard('e');
  expect(fired(screen)).toEqual(['palette.toggle']);

  // …and the toggle still closes it again.
  await userEvent.keyboard('{Control>}k{/Control}');
  await expect.element(screen.getByTestId('palette-open')).toHaveTextContent('closed');
});

test('an admin-only trigger is inert for a non-admin viewer', async () => {
  const screen = await render(HotkeyAppFixture, { isAdmin: false });

  await userEvent.keyboard('a');
  // A public trigger still works, so this is gating rather than a dead listener.
  await userEvent.keyboard('e');

  await expect.element(screen.getByTestId('fired')).toHaveTextContent('post.edit');
  expect(fired(screen)).toEqual(['post.edit']);
});

test('the same trigger fires for an admin viewer', async () => {
  const screen = await render(HotkeyAppFixture, { isAdmin: true });

  await userEvent.keyboard('a');

  await expect.element(screen.getByTestId('fired')).toHaveTextContent('admin.publish');
});
