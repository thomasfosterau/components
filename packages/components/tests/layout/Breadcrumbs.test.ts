import { page } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Breadcrumbs from '../../src/lib/layout/Breadcrumbs.svelte';
import BreadcrumbsItemFixture from './fixtures/BreadcrumbsItemFixture.svelte';
import OverflowRowsFixture from './fixtures/OverflowRowsFixture.svelte';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Taxa', href: '/taxa' },
  { label: 'Rosa canina' },
];

test('is a labelled navigation landmark around an ordered list', async () => {
  const screen = await render(Breadcrumbs, { items });

  const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
  await expect.element(nav).toBeInTheDocument();
  expect(nav.element().querySelector('ol')).not.toBeNull();
  await expect.element(screen.getByRole('list')).toBeInTheDocument();
});

test('takes its landmark name from the label prop', async () => {
  const screen = await render(Breadcrumbs, { items, label: 'You are here' });

  await expect
    .element(screen.getByRole('navigation', { name: 'You are here' }))
    .toBeInTheDocument();
});

test('links the ancestors and marks the trailing crumb as the current page', async () => {
  const screen = await render(Breadcrumbs, { items });

  await expect.element(screen.getByRole('link', { name: 'Taxa' })).toHaveAttribute('href', '/taxa');

  const current = screen.getByText('Rosa canina');
  expect(current.element().tagName).toBe('SPAN');
  await expect.element(current).toHaveAttribute('aria-current', 'page');
});

test('no crumb but the last one carries aria-current', async () => {
  const screen = await render(Breadcrumbs, { items });

  expect(screen.getByRole('link', { name: 'Taxa' }).element()).not.toHaveAttribute('aria-current');
});

test('the trailing crumb is text even when it was given an href', async () => {
  const screen = await render(Breadcrumbs, {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Here', href: '/here' },
    ],
  });

  expect(screen.getByRole('link', { name: 'Here' }).elements()).toHaveLength(0);
  await expect.element(screen.getByText('Here')).toHaveAttribute('aria-current', 'page');
});

test('an item snippet keeps the aria-current contract on the <li>', async () => {
  const screen = await render(BreadcrumbsItemFixture, { items });

  await expect.element(screen.getByTestId('custom-current')).toBeInTheDocument();
  const li = screen.getByTestId('custom-current').element().closest('li');
  expect(li?.getAttribute('aria-current')).toBe('page');
  expect(
    screen
      .getByRole('link', { name: 'Taxa' })
      .element()
      .closest('li')
      ?.getAttribute('aria-current'),
  ).toBeNull();
});

test('overflow collapses the middle crumbs into a "Show path" menu, keeping the first and the current page', async () => {
  await render(OverflowRowsFixture);

  const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
  const more = nav.getByRole('button', { name: 'Show path' });
  await expect.element(more).toBeVisible();
  await expect.element(more).toHaveTextContent('…');
  await expect.element(nav.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect.element(nav.getByText('Booths')).toHaveAttribute('aria-current', 'page');

  const shownLinks = nav
    .getByRole('link')
    .elements()
    .map((link) => link.textContent?.trim());
  await more.click();
  const menu = page.getByRole('menu', { name: 'Show path' });
  const hiddenLinks = menu
    .getByRole('menuitem')
    .elements()
    .map((link) => link.textContent?.trim());
  expect(hiddenLinks.length).toBeGreaterThan(0);
  expect([shownLinks[0], ...hiddenLinks, ...shownLinks.slice(1)]).toEqual([
    'Home',
    'Elections and referendums',
    'Federal election 2025',
    'House of Representatives',
    'Division of Kingsford Smith',
  ]);
});
