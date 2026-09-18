/**
 * `PaginationFooter` is the count and the pager from ONE set of numbers —
 * the pairing exists because threading the limit, the offset and the total
 * through two components at each call site is how they come to disagree
 * about which request they came from.
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PaginationFooter from '../../src/lib/data/PaginationFooter.svelte';

const href = (offset: number): string => `/p?offset=${offset}`;

test('pairs the count with the pager', async () => {
  const screen = await render(PaginationFooter, {
    shown: 20,
    offset: 40,
    limit: 20,
    total: 151,
    href,
    locales: 'en-AU',
  });

  await expect.element(screen.getByText('Showing 20 of 151')).toBeInTheDocument();
  await expect.element(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('link', { name: 'Next' }))
    .toHaveAttribute('href', '/p?offset=60');
});

test('drops both halves when there is one page and nothing shown', async () => {
  const screen = await render(PaginationFooter, {
    shown: 0,
    offset: 0,
    limit: 20,
    total: 0,
    href,
  });

  expect(screen.getByText(/Showing/).elements()).toHaveLength(0);
  expect(screen.getByRole('navigation').elements()).toHaveLength(0);
});

test('passes the words through to both halves', async () => {
  const screen = await render(PaginationFooter, {
    shown: 20,
    offset: 0,
    limit: 20,
    total: 151,
    href,
    label: 'Result pages',
    nextLabel: 'Suivant',
    countLabel: (shown, total) => `${shown} sur ${total}`,
  });

  await expect.element(screen.getByText('20 sur 151')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('navigation', { name: 'Result pages' }))
    .toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Suivant' })).toBeInTheDocument();
});
