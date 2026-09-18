/**
 * `ItemList`'s two ARIA modes: a plain `<ul>` whose list structure is the
 * whole semantics, and the ARIA feed pattern, where the position of each
 * article within the whole stream has to be stated because only a window of
 * it is in the DOM.
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ItemListFixture from './fixtures/ItemListFixture.svelte';

test('is a list of list items by default', async () => {
  const screen = await render(ItemListFixture);

  await expect.element(screen.getByRole('list')).toBeInTheDocument();
  expect(screen.getByRole('listitem').elements()).toHaveLength(3);
  expect(screen.getByRole('feed').elements()).toHaveLength(0);
});

test('feed mode states each article’s position in the whole stream', async () => {
  const screen = await render(ItemListFixture, { feed: true, label: 'Recent posts' });

  await expect.element(screen.getByRole('feed', { name: 'Recent posts' })).toBeInTheDocument();
  await expect.element(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'false');

  const articles = screen.getByRole('article').elements();
  expect(articles).toHaveLength(3);
  expect(articles[0]).toHaveAttribute('aria-posinset', '1');
  expect(articles[0]).toHaveAttribute('aria-setsize', '3');
  expect(articles[2]).toHaveAttribute('aria-posinset', '3');
  // Focusable for the feed pattern's Page Down / Page Up, but not in the tab
  // order — the links inside the articles are.
  expect(articles[0]).toHaveAttribute('tabindex', '-1');

  // A feed is not a list, so it does not claim to be one.
  expect(screen.getByRole('list').elements()).toHaveLength(0);
});

test('reports that more is on the way with aria-busy', async () => {
  const screen = await render(ItemListFixture, { feed: true, label: 'Recent posts', busy: true });

  await expect.element(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'true');
});

test('renders the empty line instead of an empty list', async () => {
  const screen = await render(ItemListFixture, { items: [], emptyMessage: 'No gardens yet.' });

  await expect.element(screen.getByText('No gardens yet.')).toBeInTheDocument();
  expect(screen.getByRole('list').elements()).toHaveLength(0);
});

test('the cards variant draws each row on its own surface', async () => {
  const screen = await render(ItemListFixture, { variant: 'cards' });

  await expect.element(screen.getByRole('list')).toHaveClass('grid');
  expect(screen.getByRole('listitem').elements()[0]).toHaveClass('card');
});

test('the stacked variant divides the rows instead', async () => {
  const screen = await render(ItemListFixture, { variant: 'stacked' });

  await expect.element(screen.getByRole('list')).toHaveClass('divide-y');
  expect(screen.getByRole('listitem').elements()[0]).not.toHaveClass('card');
});

test('a row is one link, named by its title, with its subtitle beside it', async () => {
  const screen = await render(ItemListFixture);

  await expect
    .element(screen.getByRole('link', { name: 'Back bed' }))
    .toHaveAttribute('href', '/gardens/1');
  await expect.element(screen.getByText('Sown in March')).toBeInTheDocument();
  await expect.element(screen.getByText('Private')).toBeInTheDocument();
  // The badge is text, not a second target.
  expect(screen.getByRole('link').elements()).toHaveLength(3);
});
