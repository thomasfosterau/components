/**
 * `HotkeyHelpDialog` — the `?` overlay. What matters is that it is opened by
 * the registered hotkey (not by a click the component owns), that it lists
 * exactly what the registry holds for THIS viewer, split into the page and
 * global sections, and that it is a properly named modal, because it is this
 * library's `Dialog` underneath.
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import HotkeyAppFixture from './fixtures/HotkeyAppFixture.svelte';

test('“?” opens a dialog named by its title prop', async () => {
  const screen = await render(HotkeyAppFixture);

  expect(screen.getByRole('dialog').elements()).toHaveLength(0);

  await userEvent.keyboard('?');

  await expect.element(screen.getByRole('dialog')).toHaveAccessibleName('Keyboard shortcuts');
});

test('the title is a prop', async () => {
  const screen = await render(HotkeyAppFixture, { helpTitle: 'Raccourcis clavier' });

  await userEvent.keyboard('?');

  await expect.element(screen.getByRole('dialog')).toHaveAccessibleName('Raccourcis clavier');
});

test('it lists the live registrations, page actions under the page heading', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('?');

  await expect.element(screen.getByRole('heading', { name: 'This page' })).toBeInTheDocument();
  await expect.element(screen.getByRole('heading', { name: 'Everywhere' })).toBeInTheDocument();

  // A page action, with its key chip beside it.
  await expect.element(screen.getByText('Edit post')).toBeInTheDocument();
  const row = screen.getByText('Edit post').element().closest('li');
  expect(row?.querySelector('kbd')?.textContent).toBe('E');
  // A sequence, rendered as an instruction.
  await expect.element(screen.getByText('Go to posts')).toBeInTheDocument();
  await expect.element(screen.getByText('then')).toBeInTheDocument();
  // A global one.
  await expect.element(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
});

test('the group headings are props', async () => {
  const screen = await render(HotkeyAppFixture, {
    groupLabels: { page: 'Cette page', global: 'Partout' },
  });

  await userEvent.keyboard('?');

  await expect.element(screen.getByRole('heading', { name: 'Cette page' })).toBeInTheDocument();
  await expect.element(screen.getByRole('heading', { name: 'Partout' })).toBeInTheDocument();
});

test('an admin-only hotkey is absent for a non-admin viewer', async () => {
  const screen = await render(HotkeyAppFixture, { isAdmin: false });

  await userEvent.keyboard('?');

  await expect.element(screen.getByText('Edit post')).toBeInTheDocument();
  expect(screen.getByText('Publish everything').elements()).toHaveLength(0);
});

test('an admin-only hotkey is listed for an admin viewer', async () => {
  const screen = await render(HotkeyAppFixture, { isAdmin: true });

  await userEvent.keyboard('?');

  await expect.element(screen.getByText('Publish everything')).toBeInTheDocument();
});

test('with nothing registered on the page, only the global section shows', async () => {
  const screen = await render(HotkeyAppFixture, { withPageActions: false });

  await userEvent.keyboard('?');

  await expect.element(screen.getByRole('heading', { name: 'Everywhere' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'This page' }).elements()).toHaveLength(0);
});

test('with nothing registered at all it says so, and that string is a prop', async () => {
  const screen = await render(HotkeyAppFixture, {
    withPageActions: false,
    withGlobalActions: false,
    emptyLabel: 'Nothing to press here',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Open help' }));

  await expect.element(screen.getByText('Nothing to press here')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Everywhere' }).elements()).toHaveLength(0);
});

test('Escape closes it, and the hotkey opens it again', async () => {
  const screen = await render(HotkeyAppFixture);

  await userEvent.keyboard('?');
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);

  await userEvent.keyboard('?');
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
});
