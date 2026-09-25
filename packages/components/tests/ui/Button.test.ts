import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Button from '../../src/lib/ui/Button.svelte';
import { textSnippet } from './snippets.ts';

test('is a real button with its children as its accessible name', async () => {
  const screen = await render(Button, { children: textSnippet('Save changes') });

  await expect.element(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
});

test('defaults to type="button" so it cannot submit a form by accident', async () => {
  const screen = await render(Button, { children: textSnippet('Save changes') });

  await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'button');
});

test('activates on Enter and on Space from the keyboard', async () => {
  const onclick = vi.fn();
  const screen = await render(Button, { children: textSnippet('Save changes'), onclick });

  await userEvent.tab();
  await expect.element(screen.getByRole('button')).toHaveFocus();

  await userEvent.keyboard('{Enter}');
  await userEvent.keyboard(' ');

  expect(onclick).toHaveBeenCalledTimes(2);
});

test('loading is busy AND disabled, and the name does not change', async () => {
  const screen = await render(Button, { children: textSnippet('Save changes'), loading: true });

  const button = screen.getByRole('button', { name: 'Save changes' });
  await expect.element(button).toHaveAttribute('aria-busy', 'true');
  await expect.element(button).toBeDisabled();
});

test('applies the tone, variant and size classes and merges the caller’s last', async () => {
  const screen = await render(Button, {
    children: textSnippet('Save changes'),
    tone: 'primary',
    variant: 'outline',
    size: 'sm',
    block: true,
    class: 'mt-4',
  });

  const button = screen.getByRole('button');
  await expect.element(button).toHaveClass('btn');
  await expect.element(button).toHaveClass('btn-primary');
  await expect.element(button).toHaveClass('btn-outline');
  await expect.element(button).toHaveClass('btn-sm');
  await expect.element(button).toHaveClass('btn-block');
  await expect.element(button).toHaveClass('mt-4');
});
