import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Section from '../../src/lib/layout/Section.svelte';
import { htmlSnippet } from './snippets.ts';

const rows = htmlSnippet('<ul data-testid="rows"><li>First edition</li></ul>');

test('is a region named by its own heading', async () => {
  const screen = await render(Section, { title: 'Editions', children: rows });

  const region = screen.getByRole('region', { name: 'Editions' });
  await expect.element(region).toBeInTheDocument();
  expect(region.element().tagName).toBe('SECTION');

  const heading = screen.getByRole('heading', { level: 2, name: 'Editions' });
  await expect.element(heading).toBeInTheDocument();
  expect(region.element().getAttribute('aria-labelledby')).toBe(heading.element().id);
});

test('the heading id is a slug of the title, so the section is addressable', async () => {
  const screen = await render(Section, { title: 'Growing conditions & care', children: rows });

  await expect
    .element(screen.getByRole('heading'))
    .toHaveAttribute('id', 'growing-conditions-care');
});

test('an explicit headingId wins', async () => {
  const screen = await render(Section, {
    title: 'Editions',
    headingId: 'book-editions',
    children: rows,
  });

  await expect.element(screen.getByRole('heading')).toHaveAttribute('id', 'book-editions');
  await expect
    .element(screen.getByRole('region', { name: 'Editions' }))
    .toHaveAttribute('aria-labelledby', 'book-editions');
});

test('the heading level is a prop', async () => {
  const screen = await render(Section, { title: 'Tissues', headingLevel: 3, children: rows });

  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Tissues' }))
    .toBeInTheDocument();
});

test('the count is locale-formatted and part of the heading', async () => {
  const screen = await render(Section, {
    title: 'Observations',
    count: 12_480,
    locales: 'en-AU',
    children: rows,
  });

  await expect
    .element(screen.getByRole('heading', { name: 'Observations (12,480)' }))
    .toBeInTheDocument();
});

test('renders the rows when it is not empty', async () => {
  const screen = await render(Section, { title: 'Editions', children: rows });

  await expect.element(screen.getByTestId('rows')).toBeInTheDocument();
});

test('empty swaps the rows for the default message', async () => {
  const screen = await render(Section, { title: 'Editions', empty: true, children: rows });

  expect(screen.getByTestId('rows').elements()).toHaveLength(0);
  await expect.element(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  // Still a region: a reader navigating by landmarks learns the section is
  // empty rather than finding nothing at all.
  await expect.element(screen.getByRole('region', { name: 'Editions' })).toBeInTheDocument();
});

test('an emptyState snippet replaces the default message', async () => {
  const screen = await render(Section, {
    props: {
      title: 'Gardens',
      empty: true,
      emptyMessage: 'Unused.',
      emptyState: htmlSnippet('<p data-testid="custom-empty">No gardens yet</p>'),
      children: rows,
    },
  });

  await expect.element(screen.getByTestId('custom-empty')).toBeInTheDocument();
  expect(screen.getByText('Unused.').elements()).toHaveLength(0);
});

test('the description and the actions render beside the heading', async () => {
  const screen = await render(Section, {
    props: {
      title: 'Observations',
      description: 'The most recent three.',
      actions: htmlSnippet('<a href="/observations">See all</a>'),
      children: rows,
    },
  });

  await expect.element(screen.getByText('The most recent three.')).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'See all' })).toBeInTheDocument();
});
