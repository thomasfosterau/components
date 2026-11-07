/**
 * `PromptDialog`'s contract: focus lands in the field with its value
 * selected, Enter submits through the form, Confirm stays disabled — with the
 * field saying why — while the value is invalid, a rejection keeps the dialog
 * open with the message under the field, closing aborts the work in flight,
 * type-to-confirm is exact, and form mode is a real POST.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PromptDialogFixture from './fixtures/PromptDialogFixture.svelte';

/** A bed needs a name. */
const validate = (value: string): readonly string[] =>
  value.trim() === '' ? ['A bed needs a name.'] : [];

const openDialog = async (screen: Awaited<ReturnType<typeof render>>): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Rename…' }));
  await expect.element(screen.getByRole('dialog', { name: 'Rename bed' })).toBeVisible();
};

test('opening focuses the field with its value selected', async () => {
  const screen = await render(PromptDialogFixture, { value: 'Bed 4' });
  await openDialog(screen);

  const field = screen.getByRole('textbox', { name: 'Name' });
  await expect.element(field).toHaveFocus();
  await expect.element(field).toHaveValue('Bed 4');
  const element = field.element();
  expect(element instanceof HTMLInputElement && element.selectionStart).toBe(0);
  expect(element instanceof HTMLInputElement && element.selectionEnd).toBe(5);
});

test('an invalid value disables Confirm and the field says why', async () => {
  const screen = await render(PromptDialogFixture, { value: 'Bed 4', validate });
  await openDialog(screen);

  await userEvent.clear(screen.getByRole('textbox', { name: 'Name' }));
  const field = screen.getByRole('textbox', { name: 'Name' });
  await expect.element(field).toHaveAttribute('aria-invalid', 'true');
  await expect.element(field).toHaveAccessibleDescription(/A bed needs a name\./);
  await expect.element(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
});

test('Enter submits, the callback gets the value, and resolving closes', async () => {
  const onConfirm = vi.fn<(value: string, signal: AbortSignal) => Promise<void>>(() =>
    Promise.resolve(),
  );
  const screen = await render(PromptDialogFixture, { value: 'Bed 4', onConfirm });
  await openDialog(screen);

  await userEvent.keyboard('Herb spiral{Enter}');

  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
  expect(onConfirm.mock.calls[0]?.[0]).toBe('Herb spiral');
  await expect.element(screen.getByRole('button', { name: 'Rename…' })).toHaveFocus();
});

test('a rejection keeps the dialog open, with the message under the field', async () => {
  const screen = await render(PromptDialogFixture, {
    value: 'Bed 4',
    onConfirm: () => Promise.reject(new Error('That name is taken.')),
  });
  await openDialog(screen);

  await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

  await expect
    .element(screen.getByRole('textbox', { name: 'Name' }))
    .toHaveAccessibleDescription(/That name is taken\./);
  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('open');
});

test('Escape while in flight aborts the signal', async () => {
  let seen: AbortSignal | undefined;
  const onConfirm = vi.fn<(value: string, signal: AbortSignal) => Promise<void>>(
    (_value, signal) => {
      seen = signal;
      return new Promise(() => {});
    },
  );
  const screen = await render(PromptDialogFixture, { value: 'Bed 4', onConfirm });
  await openDialog(screen);

  await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
  await expect
    .element(screen.getByRole('button', { name: 'Rename' }))
    .toHaveAttribute('aria-busy', 'true');
  await userEvent.keyboard('{Escape}');

  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
  expect(seen?.aborted).toBe(true);
});

test('requireMatch enables Confirm only on an exact match', async () => {
  const screen = await render(PromptDialogFixture, { requireMatch: 'Bed 4' });
  await openDialog(screen);

  const confirm = screen.getByRole('button', { name: 'Rename' });
  const field = screen.getByRole('textbox', { name: 'Name' });
  await expect.element(field).toHaveAccessibleDescription(/To confirm, type Bed 4/);
  await userEvent.type(field, 'bed 4');
  await expect.element(confirm).toBeDisabled();
  await userEvent.clear(field);
  await userEvent.type(field, 'Bed 4');
  await expect.element(confirm).toBeEnabled();
});

test('form mode is a real POST of the field under its name', async () => {
  const onSubmitted = vi.fn<(data: FormData, form: HTMLFormElement) => void>();
  const screen = await render(PromptDialogFixture, {
    value: 'Bed 4',
    formMode: true,
    onSubmitted,
  });
  await openDialog(screen);

  await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

  const [data, form] = onSubmitted.mock.calls[0] ?? [];
  expect(form?.getAttribute('method')?.toLowerCase()).toBe('post');
  expect(form?.getAttribute('action')).toBe('/beds/4?/rename');
  expect(data?.get('name')).toBe('Bed 4');
});
