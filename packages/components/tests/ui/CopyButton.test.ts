/**
 * `CopyButton`'s contract: it writes the value (read at click time), its
 * accessible name never changes, the outcome is announced in a polite status
 * that empties after `resetAfter`, and a failure is reported, not swallowed.
 */

import { userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CopyButton from '../../src/lib/ui/CopyButton.svelte';

const stubClipboard = (
  writeText: (text: string) => Promise<void>,
): ReturnType<typeof vi.fn<(text: string) => Promise<void>>> => {
  const spy = vi.fn<(text: string) => Promise<void>>(writeText);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: spy },
  });
  return spy;
};

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
});

test('copies the value and announces it, without changing its name', async () => {
  const writeText = stubClipboard(() => Promise.resolve());
  const onCopy = vi.fn<(value: string) => void>();
  const screen = await render(CopyButton, { value: 'pnpm add @thomasfosterau/components', onCopy });

  await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

  expect(writeText).toHaveBeenCalledWith('pnpm add @thomasfosterau/components');
  expect(onCopy).toHaveBeenCalledWith('pnpm add @thomasfosterau/components');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied');
  await expect.element(screen.getByRole('button')).toHaveAccessibleName('Copy');
});

test('a function value is read at click time', async () => {
  const writeText = stubClipboard(() => Promise.resolve());
  let current = 'first';
  const screen = await render(CopyButton, { value: () => current });

  current = 'second';
  await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

  expect(writeText).toHaveBeenCalledWith('second');
});

test('the status empties after resetAfter, so the next copy is announced again', async () => {
  stubClipboard(() => Promise.resolve());
  // Long enough that the matcher's polling cannot miss the "Copied" window
  // on a loaded machine (at 50 ms it could, and then waited out the timeout).
  const screen = await render(CopyButton, { value: 'x', resetAfter: 1000 });

  await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
  await expect.element(screen.getByRole('status')).toHaveTextContent('Copied');
  await expect.element(screen.getByRole('status')).toHaveTextContent('');
});

test('a failed write is announced and reported', async () => {
  stubClipboard(() => Promise.reject(new Error('denied')));
  const onError = vi.fn<(error: unknown) => void>();
  const screen = await render(CopyButton, { value: 'x', onError });

  await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

  await expect.element(screen.getByRole('status')).toHaveTextContent('Could not copy');
  expect(onError).toHaveBeenCalledTimes(1);
});

test('a missing clipboard API still renders, and fails audibly', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  const onError = vi.fn<(error: unknown) => void>();
  const screen = await render(CopyButton, { value: 'x', onError });

  await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

  await expect.element(screen.getByRole('status')).toHaveTextContent('Could not copy');
  expect(onError).toHaveBeenCalledTimes(1);
});

test('iconOnly shows no text but keeps the name', async () => {
  const screen = await render(CopyButton, { value: 'x', iconOnly: true, label: 'Copy id' });

  const button = screen.getByRole('button', { name: 'Copy id' });
  await expect.element(button).toHaveClass('btn-square');
  await expect.element(screen.getByText('Copy id')).toHaveClass('sr-only');
});
