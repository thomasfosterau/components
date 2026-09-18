import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LinkButton from '../../src/lib/ui/LinkButton.svelte';
import { textSnippet } from './snippets.ts';

test('is a link, not a button', async () => {
  const screen = await render(LinkButton, {
    href: '/gardens/new',
    children: textSnippet('Start a garden'),
  });

  const link = screen.getByRole('link', { name: 'Start a garden' });
  await expect.element(link).toHaveAttribute('href', '/gardens/new');
});

test('a disabled link keeps its name, loses its href and announces the state', async () => {
  const screen = await render(LinkButton, {
    href: '/gardens/new',
    disabled: true,
    children: textSnippet('Start a garden'),
  });

  // No `href`, so it is no longer a link: the role has to be restored by hand.
  const control = screen.getByRole('button', { name: 'Start a garden' });
  await expect.element(control).toHaveAttribute('aria-disabled', 'true');
  await expect.element(control).toHaveAttribute('tabindex', '-1');
  await expect.element(control).not.toHaveAttribute('href');
});

test('external links open in a new tab with the safe rel', async () => {
  const screen = await render(LinkButton, {
    href: 'https://example.org/handbook',
    external: true,
    children: textSnippet('Read the handbook'),
  });

  const link = screen.getByRole('link', { name: 'Read the handbook' });
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer');
  // An absolute destination is not rewritten by the context.
  await expect.element(link).toHaveAttribute('href', 'https://example.org/handbook');
});
