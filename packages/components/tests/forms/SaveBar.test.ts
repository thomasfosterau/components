import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SaveBar from '../../src/lib/forms/SaveBar.svelte';
import SaveBarFixture from './fixtures/SaveBarFixture.svelte';

test('a clean form shows no bar', async () => {
  const screen = await render(SaveBar, { dirty: false });

  expect(screen.getByRole('region').elements()).toHaveLength(0);
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('a dirty form shows a region named by its message, with Save and Discard', async () => {
  const screen = await render(SaveBar, { dirty: true });

  const region = screen.getByRole('region', { name: 'Unsaved changes' });
  await expect.element(region).toBeInTheDocument();
  await expect.element(region.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  await expect.element(region.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
});

test('it announces the message once, politely, and does not take focus', async () => {
  const screen = await render(SaveBar, { dirty: false });
  const status = screen.getByRole('status');
  await expect.element(status).toHaveTextContent('');

  await screen.rerender({ dirty: true });
  await expect.element(status).toHaveTextContent('Unsaved changes');
  expect(document.activeElement).toBe(document.body);
  expect(screen.getByRole('status').elements()).toHaveLength(1);
});

test('the bar going away after a save is announced as saved', async () => {
  const screen = await render(SaveBar, { dirty: true, savedLabel: 'Bed saved' });

  await screen.rerender({ dirty: false });
  await expect.element(screen.getByRole('status')).toHaveTextContent('Bed saved');
  expect(screen.getByRole('region').elements()).toHaveLength(0);
});

test('Save with a form id submits that form from outside it', async () => {
  const onSubmitted = vi.fn<() => void>();
  const screen = await render(SaveBarFixture, { dirty: true, onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSubmitted).toHaveBeenCalledOnce();
  await expect.element(screen.getByRole('region')).not.toBeInTheDocument();
  await expect.element(screen.getByRole('status')).toHaveTextContent('Saved');
});

test('Save leaves focus where it was when it is a callback', async () => {
  const onSave = vi.fn<(signal: AbortSignal) => Promise<void>>(() => Promise.resolve());
  const screen = await render(SaveBar, { dirty: true, onSave });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSave).toHaveBeenCalledOnce();
  expect(onSave.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
});

test('Save is busy while a callback is in flight', async () => {
  const { promise, resolve } = Promise.withResolvers<void>();
  const onSave = (): Promise<void> => promise;
  const screen = await render(SaveBar, { dirty: true, onSave });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await expect
    .element(screen.getByRole('button', { name: 'Save' }))
    .toHaveAttribute('aria-busy', 'true');
  await expect.element(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();

  resolve();
  await expect
    .element(screen.getByRole('button', { name: 'Save' }))
    .not.toHaveAttribute('aria-busy');
});

test('Discard asks first, and confirming calls onDiscard', async () => {
  const onDiscard = vi.fn<() => void>();
  const screen = await render(SaveBar, { dirty: true, onDiscard });

  await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect(onDiscard).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole('dialog', { name: 'Discard changes?' }))
    .toBeInTheDocument();

  await userEvent.click(screen.getByRole('dialog').getByRole('button', { name: 'Discard' }));
  await vi.waitFor(() => {
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});

test('cancelling the confirmation keeps the changes', async () => {
  const onDiscard = vi.fn<() => void>();
  const screen = await render(SaveBar, { dirty: true, onDiscard });

  await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
  await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

  expect(onDiscard).not.toHaveBeenCalled();
  await expect.element(screen.getByRole('region', { name: 'Unsaved changes' })).toBeInTheDocument();
});

test('confirmDiscard false discards at once, and says nothing afterwards', async () => {
  const onDiscard = vi.fn<() => void>();
  const screen = await render(SaveBarFixture, { dirty: true, confirmDiscard: false, onDiscard });

  await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

  expect(onDiscard).toHaveBeenCalledOnce();
});

test('message, labels and position are props, and the caller class and id are kept', async () => {
  const screen = await render(SaveBar, {
    dirty: true,
    message: 'Ungespeichert',
    saveLabel: 'Speichern',
    discardLabel: 'Verwerfen',
    position: 'top',
    id: 'bar',
    class: 'extra',
  });

  const region = screen.getByRole('region', { name: 'Ungespeichert' });
  await expect.element(region).toHaveAttribute('id', 'bar');
  await expect.element(region).toHaveClass('top-0', 'extra');
  await expect.element(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Verwerfen' })).toBeInTheDocument();
});
