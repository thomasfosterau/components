import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EmptyState from '../../src/lib/ui/EmptyState.svelte';
import { htmlSnippet } from './snippets.ts';

test('the title is a real heading, defaulting to h2', async () => {
  const screen = await render(EmptyState, { title: 'No gardens yet' });

  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'No gardens yet' }))
    .toBeInTheDocument();
});

test('the heading level is a prop, for an empty section inside a page', async () => {
  const screen = await render(EmptyState, {
    title: 'Nothing observed this week',
    headingLevel: 3,
  });

  await expect.element(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
});

test('the description and the action render', async () => {
  const screen = await render(EmptyState, {
    title: 'No gardens yet',
    description: 'Start with one and add the plants later.',
    action: htmlSnippet('<a href="/gardens/new">Start a garden</a>'),
  });

  await expect.element(screen.getByText('Start with one and add the plants later.')).toBeVisible();
  await expect.element(screen.getByRole('link', { name: 'Start a garden' })).toBeInTheDocument();
});

test('the icon is hidden from the accessibility tree', async () => {
  const screen = await render(EmptyState, {
    title: 'No gardens yet',
    icon: htmlSnippet('<svg role="img" aria-label="sprout"></svg>'),
  });

  // Wrapped in `aria-hidden`, so even a labelled graphic inside it is gone.
  await expect.element(screen.getByRole('img', { name: 'sprout' })).not.toBeInTheDocument();
});
