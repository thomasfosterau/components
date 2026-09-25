import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Alert from '../../src/lib/ui/Alert.svelte';
import { textSnippet } from './snippets.ts';

test('an error alert interrupts by default', async () => {
  const screen = await render(Alert, {
    tone: 'error',
    children: textSnippet('That garden could not be deleted.'),
  });

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('That garden could not be deleted.');
});

test('every other tone is polite by default', async () => {
  const screen = await render(Alert, {
    tone: 'success',
    children: textSnippet('Your garden was saved.'),
  });

  await expect.element(screen.getByRole('status')).toHaveTextContent('Your garden was saved.');
});

test('live="off" renders no live region at all', async () => {
  const screen = await render(Alert, {
    tone: 'info',
    live: 'off',
    children: textSnippet('Watering runs at 5am.'),
    'data-testid': 'alert',
  });

  await expect.element(screen.getByTestId('alert')).not.toHaveAttribute('role');
});

test('role="alert" is not doubled with an explicit aria-live', async () => {
  const screen = await render(Alert, {
    live: 'assertive',
    children: textSnippet('Something happened.'),
  });

  // `role="alert"` already implies assertive; a second copy is how a region
  // ends up announced twice.
  await expect.element(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
});

test('the dismiss button is labelled and calls back', async () => {
  const onDismiss = vi.fn();
  const screen = await render(Alert, {
    tone: 'success',
    live: 'off',
    onDismiss,
    dismissLabel: 'Dismiss this notice',
    children: textSnippet('Published.'),
  });

  const button = screen.getByRole('button', { name: 'Dismiss this notice' });
  await userEvent.click(button);

  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('the title renders above the body', async () => {
  const screen = await render(Alert, {
    tone: 'warning',
    live: 'off',
    title: 'Frost warning',
    children: textSnippet('Cover anything tender.'),
    'data-testid': 'alert',
  });

  const alert = screen.getByTestId('alert');
  await expect.element(alert).toHaveTextContent('Frost warning');
  await expect.element(alert).toHaveTextContent('Cover anything tender.');
});
