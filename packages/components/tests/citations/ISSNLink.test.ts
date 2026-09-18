import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ISSNLink from '../../src/lib/citations/ISSNLink.svelte';

test('resolves to a WorldCat lookup over https, opened in a new tab safely', async () => {
  // The old copy dropped `target`/`rel` entirely for ISSN — fixed here to
  // match `DOILink` and `ISBNLink`.
  const screen = await render(ISSNLink, { issn: '1030-1887' });
  const link = screen.getByRole('link', { name: '1030-1887' });
  await expect.element(link).toHaveAttribute('href', 'https://www.worldcat.org/issn/1030-1887');
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer');
});

test('carries a caller-supplied itemprop', async () => {
  const screen = await render(ISSNLink, { issn: '1030-1887', itemprop: 'issn' });
  await expect.element(screen.getByRole('link')).toHaveAttribute('itemprop', 'issn');
});
