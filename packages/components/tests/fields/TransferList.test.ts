/**
 * `TransferList`'s contract: two named listboxes in a group named by the
 * `FormField` label, buttons disabled while there is nothing to move, Enter
 * and double-click moves that keep focus in the source list, Alt+↑/↓
 * reordering, the filter, the announcement and the values a form posts.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import TransferListFixture from './fixtures/TransferListFixture.svelte';

test('is a group named by its label, holding two named listboxes and the move buttons', async () => {
  const screen = await render(TransferListFixture, { value: ['Email'] });

  const group = screen.getByRole('group', { name: 'Columns' });
  await expect.element(group).toHaveAccessibleDescription("Choose and order the export's columns.");
  const available = screen.getByRole('listbox', { name: 'Available' });
  const selected = screen.getByRole('listbox', { name: 'Selected' });
  expect(available.getByRole('option').elements()).toHaveLength(4);
  await expect.element(selected.getByRole('option', { name: 'Email' })).toBeVisible();
  await expect.element(screen.getByRole('group', { name: 'Transfer' })).toBeVisible();
});

test('buttons are disabled while there is nothing to move', async () => {
  const screen = await render(TransferListFixture, {});

  await expect.element(screen.getByRole('button', { name: 'Add selected' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Remove selected' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Remove all' })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'Add all' })).toBeEnabled();

  await screen.getByRole('option', { name: 'Email' }).click();
  await expect.element(screen.getByRole('button', { name: 'Add selected' })).toBeEnabled();
});

test('Add selected moves the highlighted options and announces it', async () => {
  const screen = await render(TransferListFixture, {});

  await screen.getByRole('option', { name: 'Notes' }).click();
  await screen.getByRole('option', { name: 'Name' }).click({ modifiers: ['ControlOrMeta'] });
  await screen.getByRole('button', { name: 'Add selected' }).click();

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Name|Notes');
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 moved to Selected');
});

test('Add all skips a disabled option; Remove all brings everything back', async () => {
  const screen = await render(TransferListFixture, {});

  await screen.getByRole('button', { name: 'Add all' }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Name|Email|Address|Notes');
  await expect
    .element(
      screen.getByRole('listbox', { name: 'Available' }).getByRole('option', { name: 'Phone' }),
    )
    .toBeVisible();

  await screen.getByRole('button', { name: 'Remove all' }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('');
  await expect.element(screen.getByRole('status')).toHaveTextContent('4 moved to Available');
});

test('Enter moves the highlighted options and focus stays in the source list', async () => {
  const screen = await render(TransferListFixture, {});

  const available = screen.getByRole('listbox', { name: 'Available' });
  await userEvent.tab();
  await expect.element(available).toHaveFocus();
  await userEvent.keyboard(' {Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Name');
  await expect.element(available).toHaveFocus();

  const selected = screen.getByRole('listbox', { name: 'Selected' });
  selected.element().focus();
  await userEvent.keyboard(' {Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('');
  await expect.element(selected).toHaveFocus();
});

test('double-clicking an option moves it', async () => {
  const screen = await render(TransferListFixture, { value: ['Email'] });

  await screen.getByRole('option', { name: 'Address' }).dblClick();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Email|Address');
  await screen.getByRole('option', { name: 'Email' }).dblClick();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Address');
});

test('orderable: Move up/down and Alt+arrows reorder the chosen values', async () => {
  const screen = await render(TransferListFixture, {
    value: ['Name', 'Email', 'Notes'],
    orderable: true,
  });

  const up = screen.getByRole('button', { name: 'Move up' });
  await expect.element(up).toBeDisabled();
  await screen.getByRole('option', { name: 'Notes' }).click();
  await up.click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Name|Notes|Email');
  await expect.element(screen.getByRole('status')).toHaveTextContent('1 moved up');

  screen.getByRole('listbox', { name: 'Selected' }).element().focus();
  await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Notes|Name|Email');
  await expect.element(up).toBeDisabled();
  await userEvent.keyboard('{Alt>}{ArrowDown}{ArrowDown}{/Alt}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Name|Email|Notes');
});

test('without orderable there are no reorder buttons and Alt+arrows do nothing', async () => {
  const screen = await render(TransferListFixture, { value: ['Name', 'Email'] });

  expect(screen.getByRole('button', { name: 'Move up' }).elements()).toHaveLength(0);
  await screen.getByRole('option', { name: 'Email' }).click();
  await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Name|Email');
});

test('searchable: the filter narrows a list, and Add all moves only what is shown', async () => {
  const screen = await render(TransferListFixture, { searchable: true });

  await screen.getByRole('searchbox', { name: 'Filter Available' }).fill('ss');
  const available = screen.getByRole('listbox', { name: 'Available' });
  expect(available.getByRole('option').elements()).toHaveLength(1);
  await screen.getByRole('button', { name: 'Add all' }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Address');
});

test('posts the chosen values in their order', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(TransferListFixture, { value: ['Notes', 'Name'], onSubmitted });

  await screen.getByRole('button', { name: 'Save' }).click();
  expect(onSubmitted.mock.calls[0]?.[0].getAll('columns')).toEqual(['Notes', 'Name']);
});
