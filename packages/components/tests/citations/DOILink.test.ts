import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import DOILink from '../../src/lib/citations/DOILink.svelte';

test('resolves to https://doi.org/<doi>, opened in a new tab safely', async () => {
  const screen = await render(DOILink, { doi: '10.1071/SB97021' });
  const link = screen.getByRole('link', { name: '10.1071/SB97021' });
  await expect.element(link).toHaveAttribute('href', 'https://doi.org/10.1071/SB97021');
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer');
});

test('carries a caller-supplied itemprop', async () => {
  const screen = await render(DOILink, { doi: '10.1071/SB97021', itemprop: 'sameAs' });
  await expect.element(screen.getByRole('link')).toHaveAttribute('itemprop', 'sameAs');
});

test('renders a caller-supplied children snippet instead of the bare doi', async () => {
  const children = createRawSnippet(() => ({ render: () => '<span>View the article</span>' }));
  const screen = await render(DOILink, { doi: '10.1071/SB97021', children });
  await expect.element(screen.getByRole('link', { name: 'View the article' })).toBeInTheDocument();
});

test('spreads native anchor attributes and merges the caller’s class', async () => {
  const screen = await render(DOILink, {
    doi: '10.1071/SB97021',
    class: 'text-lg',
    'data-testid': 'doi',
  });
  const link = screen.getByTestId('doi');
  await expect.element(link).toHaveClass('link', 'link-primary', 'link-hover', 'text-lg');
});
