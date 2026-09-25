import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ExternalLink from '../../src/lib/ui/ExternalLink.svelte';
import { textSnippet } from './snippets.ts';

test('announces the new tab in the accessible name', async () => {
  const screen = await render(ExternalLink, {
    href: 'https://example.com/~member',
    children: textSnippet('example.com/~member'),
  });

  // The visually hidden warning is part of the name, not decoration: a screen
  // reader user learns what the icon tells a sighted one.
  await expect
    .element(screen.getByRole('link'))
    .toHaveAccessibleName('example.com/~member (opens in a new tab)');
});

test('user-supplied destinations are nofollow by default', async () => {
  const screen = await render(ExternalLink, {
    href: 'https://example.com/~member',
    children: textSnippet('example.com/~member'),
  });

  const link = screen.getByRole('link');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer nofollow');
  await expect.element(link).toHaveAttribute('target', '_blank');
});

test('a destination the site composed itself is only noreferrer', async () => {
  const screen = await render(ExternalLink, {
    href: 'https://orcid.org/0000-0002-1825-0097',
    untrusted: false,
    children: textSnippet('0000-0002-1825-0097'),
  });

  await expect.element(screen.getByRole('link')).toHaveAttribute('rel', 'noreferrer');
});

test('the new-tab announcement is a prop', async () => {
  const screen = await render(ExternalLink, {
    href: 'https://example.com/',
    newTabLabel: '(s’ouvre dans un nouvel onglet)',
    children: textSnippet('example.com'),
  });

  await expect
    .element(screen.getByRole('link'))
    .toHaveAccessibleName('example.com (s’ouvre dans un nouvel onglet)');
});
