import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Link from '../../src/lib/ui/Link.svelte';
import { textSnippet } from './snippets.ts';

test('is a link named by its children', async () => {
  const screen = await render(Link, { href: '/taxa/rosa', children: textSnippet('dog rose') });

  await expect
    .element(screen.getByRole('link', { name: 'dog rose' }))
    .toHaveAttribute('href', '/taxa/rosa');
});

test('each variant carries the daisyUI link classes', async () => {
  const screen = await render(Link, {
    href: '/taxa/rosa',
    variant: 'plain',
    children: textSnippet('dog rose'),
  });

  const link = screen.getByRole('link');
  await expect.element(link).toHaveClass('link');
  await expect.element(link).toHaveClass('link-hover');
  await expect.element(link).toHaveClass('text-base-content/70');
});

test('external adds target and rel together', async () => {
  const screen = await render(Link, {
    href: 'https://example.org/records/42',
    external: true,
    children: textSnippet('example.org'),
  });

  const link = screen.getByRole('link');
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer');
});
