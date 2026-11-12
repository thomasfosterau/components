import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ConfirmButtonFixture from './fixtures/ConfirmButtonFixture.svelte';
import ConfirmButtonFormFixture from './fixtures/ConfirmButtonFormFixture.svelte';

const resolved = (): Promise<unknown> => Promise.resolve('ok');

test('the destructive action is behind a second press', async () => {
  const action = vi.fn<() => Promise<unknown>>(resolved);
  const screen = await render(ConfirmButtonFixture, { action, idleLabel: 'Delete this garden' });

  await userEvent.click(screen.getByRole('button', { name: 'Delete this garden' }));

  expect(action).not.toHaveBeenCalled();
  await expect.element(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

test('cancelling returns to the resting button', async () => {
  const action = vi.fn<() => Promise<unknown>>(resolved);
  const screen = await render(ConfirmButtonFixture, { action, idleLabel: 'Delete this garden' });

  await userEvent.click(screen.getByRole('button', { name: 'Delete this garden' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(action).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole('button', { name: 'Delete this garden' }))
    .toBeInTheDocument();
});

test('confirming runs the action', async () => {
  const action = vi.fn<() => Promise<unknown>>(resolved);
  const screen = await render(ConfirmButtonFixture, { action });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  expect(action).toHaveBeenCalledTimes(1);
});

test('a failure surfaces in an assertive alert carrying the error’s own message', async () => {
  const action = vi.fn<() => Promise<unknown>>(() =>
    Promise.reject(new Error('This garden still has 12 plants in it.')),
  );
  const screen = await render(ConfirmButtonFixture, { action });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('This garden still has 12 plants in it.');
});

test('a rejection that is not an Error shows the failure message prop', async () => {
  const action = vi.fn<() => Promise<unknown>>(() => Promise.reject('nope'));
  const screen = await render(ConfirmButtonFixture, {
    action,
    failureMessage: 'That didn’t work. Try again.',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await expect.element(screen.getByRole('alert')).toHaveTextContent('That didn’t work.');
});

test('redirectTo navigates through the components context once the action resolves', async () => {
  const onNavigate = vi.fn<(url: string) => void>();
  const screen = await render(ConfirmButtonFixture, {
    action: resolved,
    redirectTo: '/gardens',
    onNavigate,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await expect.poll(() => onNavigate.mock.calls).toEqual([['/gardens']]);
});

test('form mode: the confirm step is a POST form, behind a disclosure', async () => {
  const onSubmit = vi.fn<(data: FormData, form: HTMLFormElement) => void>();
  const action = vi.fn<() => Promise<unknown>>(resolved);
  const screen = await render(ConfirmButtonFormFixture, { onSubmit, action });

  const details = document.querySelector('details');
  expect(details?.open).toBe(false);
  // Closed, the confirm form is not rendered for anyone, so it is not in the
  // accessibility tree at all.
  expect(document.querySelector('form')?.checkVisibility()).toBe(false);

  await userEvent.click(screen.getByText('Delete this garden'));
  expect(details?.open).toBe(true);

  const confirm = screen.getByRole('button', { name: 'Confirm' });
  await expect.element(confirm).toHaveAttribute('type', 'submit');
  const form = confirm.element().closest('form');
  expect(form?.getAttribute('method')).toBe('post');
  expect(form?.getAttribute('action')).toBe('/gardens/7?/delete');

  await userEvent.click(confirm);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0]?.[0].get('id')).toBe('garden-7');
  // The browser's submit is the action; the callback is not run.
  expect(action).not.toHaveBeenCalled();
});

test('form mode: Cancel closes the disclosure without submitting', async () => {
  const onSubmit = vi.fn<(data: FormData, form: HTMLFormElement) => void>();
  const screen = await render(ConfirmButtonFormFixture, { onSubmit });

  await userEvent.click(screen.getByText('Delete this garden'));
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(document.querySelector('details')?.open).toBe(false);
  expect(onSubmit).not.toHaveBeenCalled();
});
