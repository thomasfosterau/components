/**
 * `ConfirmDialog` in both of its modes: the client-side callback (resolve →
 * close and navigate, reject → an assertive `Alert` in the still-open dialog)
 * and the progressive-enhancement POST, where the confirm button has to be a
 * real submit inside a real form or the no-JavaScript path does not exist.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import ConfirmDialogFixture from './fixtures/ConfirmDialogFixture.svelte';

test('a resolving callback closes the dialog and navigates', async () => {
  const onConfirm = vi.fn(() => Promise.resolve('gone'));
  const onNavigate = vi.fn();
  const screen = await render(ConfirmDialogFixture, {
    onConfirm,
    onNavigate,
    redirectTo: '/gardens',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
  await expect.element(screen.getByRole('dialog', { name: 'Delete this garden?' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onNavigate).toHaveBeenCalledWith('/gardens');
});

test('a rejecting callback keeps the dialog open and shows the reason assertively', async () => {
  const screen = await render(ConfirmDialogFixture, {
    onConfirm: () => Promise.reject(new Error('This garden still has 12 plants in it.')),
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
  await userEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  const alert = screen.getByRole('alert');
  await expect.element(alert).toHaveTextContent('This garden still has 12 plants in it.');
  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('open');
});

test('a rejection that is not an Error falls back to failureMessage', async () => {
  const screen = await render(ConfirmDialogFixture, {
    onConfirm: () => Promise.reject('418'),
    failureMessage: 'That didn’t work. Try again.',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
  await userEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  await expect.element(screen.getByRole('alert')).toHaveTextContent('That didn’t work. Try again.');
});

test('form mode renders a real POST form whose confirm button submits it', async () => {
  const enhance = vi.fn();
  const screen = await render(ConfirmDialogFixture, {
    form: { action: '?/delete', fields: { id: 'garden-7' }, enhance },
    confirmLabel: 'Delete it',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete garden' }));

  const confirm = screen.getByRole('button', { name: 'Delete it' });
  await expect.element(confirm).toHaveAttribute('type', 'submit');

  const form = confirm.element().closest('form');
  expect(form).not.toBeNull();
  expect(form).toHaveAttribute('action', '?/delete');
  expect(form?.getAttribute('method')?.toUpperCase()).toBe('POST');
  expect(form?.querySelector('input[type="hidden"][name="id"]')).toHaveAttribute(
    'value',
    'garden-7',
  );

  // The app's `use:enhance` is applied to the form element itself, never
  // imported here.
  expect(enhance).toHaveBeenCalledTimes(1);
  expect(enhance.mock.calls[0]?.[0]).toBe(form);
});

test('the cancel button closes without confirming, in either mode', async () => {
  const onConfirm = vi.fn(() => Promise.resolve(undefined));
  const screen = await render(ConfirmDialogFixture, { onConfirm });

  await userEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  await expect.element(screen.getByTestId('open-state')).toHaveTextContent('closed');
  expect(onConfirm).not.toHaveBeenCalled();
});

test('the body children render inside the dialog', async () => {
  const screen = await render(ConfirmDialogFixture, {
    onConfirm: () => Promise.resolve(undefined),
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete garden' }));

  await expect.element(screen.getByTestId('body')).toHaveTextContent('This cannot be undone.');
});
