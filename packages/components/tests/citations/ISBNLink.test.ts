import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ISBNLink from '../../src/lib/citations/ISBNLink.svelte';

test('resolves to a WorldCat lookup over https, opened in a new tab safely', async () => {
  const screen = await render(ISBNLink, { isbn: '9780868405048' });
  const link = screen.getByRole('link', { name: '9780868405048' });
  await expect.element(link).toHaveAttribute('href', 'https://www.worldcat.org/isbn/9780868405048');
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer');
});

test('carries a caller-supplied itemprop', async () => {
  const screen = await render(ISBNLink, { isbn: '9780868405048', itemprop: 'isbn' });
  await expect.element(screen.getByRole('link')).toHaveAttribute('itemprop', 'isbn');
});
