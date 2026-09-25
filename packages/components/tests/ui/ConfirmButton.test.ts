import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ConfirmButtonFixture from './fixtures/ConfirmButtonFixture.svelte';

const resolved = (): Promise<unknown> => Promise.resolve('ok');

test('the destructive action is behind a second press', async () => {
  const action = vi.fn(resolved);
  const screen = await render(ConfirmButtonFixture, { action, idleLabel: 'Delete this garden' });

  await userEvent.click(screen.getByRole('button', { name: 'Delete this garden' }));

  expect(action).not.toHaveBeenCalled();
  await expect.element(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

test('cancelling returns to the resting button', async () => {
  const action = vi.fn(resolved);
  const screen = await render(ConfirmButtonFixture, { action, idleLabel: 'Delete this garden' });

  await userEvent.click(screen.getByRole('button', { name: 'Delete this garden' }));
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(action).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole('button', { name: 'Delete this garden' }))
    .toBeInTheDocument();
});

test('confirming runs the action', async () => {
  const action = vi.fn(resolved);
  const screen = await render(ConfirmButtonFixture, { action });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  expect(action).toHaveBeenCalledTimes(1);
});

test('a failure surfaces in an assertive alert carrying the error’s own message', async () => {
  const action = vi.fn(() => Promise.reject(new Error('This garden still has 12 plants in it.')));
  const screen = await render(ConfirmButtonFixture, { action });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('This garden still has 12 plants in it.');
});

test('a rejection that is not an Error shows the failure message prop', async () => {
  const action = vi.fn(() => Promise.reject('nope'));
  const screen = await render(ConfirmButtonFixture, {
    action,
    failureMessage: 'That didn’t work. Try again.',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await expect.element(screen.getByRole('alert')).toHaveTextContent('That didn’t work.');
});

test('redirectTo navigates through the components context once the action resolves', async () => {
  const onNavigate = vi.fn();
  const screen = await render(ConfirmButtonFixture, {
    action: resolved,
    redirectTo: '/gardens',
    onNavigate,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

  await expect.poll(() => onNavigate.mock.calls).toEqual([['/gardens']]);
});
