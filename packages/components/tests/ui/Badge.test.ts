import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Badge from '../../src/lib/ui/Badge.svelte';
import { textSnippet } from './snippets.ts';

test('is text in a badge, with no role of its own', async () => {
  const screen = await render(Badge, { children: textSnippet('Published'), 'data-testid': 'b' });

  const badge = screen.getByTestId('b');
  await expect.element(badge).toHaveTextContent('Published');
  await expect.element(badge).toHaveClass('badge');
  // Deliberately roleless: the text carries the meaning.
  await expect.element(badge).not.toHaveAttribute('role');
});

test('tone and variant come from the lookup tables', async () => {
  const screen = await render(Badge, {
    children: textSnippet('Overdue'),
    tone: 'error',
    variant: 'outline',
    size: 'sm',
    'data-testid': 'b',
  });

  const badge = screen.getByTestId('b');
  await expect.element(badge).toHaveClass('badge-error');
  await expect.element(badge).toHaveClass('badge-outline');
  await expect.element(badge).toHaveClass('badge-sm');
});

test('a colourToken binds the custom property and replaces the tone', async () => {
  const screen = await render(Badge, {
    children: textSnippet('Full sun'),
    tone: 'error',
    colourToken: '--demo-sun',
    'data-testid': 'b',
  });

  const badge = screen.getByTestId('b');
  expect(badge.element().getAttribute('style')).toContain(
    '--badge-colour: var(--demo-sun, var(--color-neutral))',
  );
  await expect.element(badge).not.toHaveClass('badge-error');
});

test('a colourToken that is not a custom property name cannot escape the var()', async () => {
  const screen = await render(Badge, {
    children: textSnippet('Nope'),
    colourToken: 'red); position: fixed; top: 0',
    'data-testid': 'b',
  });

  const style = screen.getByTestId('b').element().getAttribute('style') ?? '';
  expect(style).toContain('--badge-colour: var(--color-neutral, var(--color-neutral))');
  expect(style).not.toContain('position');
});
