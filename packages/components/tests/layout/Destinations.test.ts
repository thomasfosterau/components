/**
 * `Sidebar` and `BottomNav` built from `destinations` (#428): the same
 * `NavDestination` list `AppShell` and `NavigationRail` read, rendered as
 * links resolved and marked current through the components context, with
 * `children` still working beside them.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import DestinationsFixture from './fixtures/DestinationsFixture.svelte';

const hrefs = (links: { elements(): Element[] }): (string | null)[] =>
  links.elements().map((link) => link.getAttribute('href'));

test('Sidebar: every destination is a link, hrefs resolved through the context', async () => {
  const screen = await render(DestinationsFixture, { component: 'sidebar' });

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect.element(nav).toBeInTheDocument();
  expect(hrefs(nav.getByRole('link'))).toEqual([
    '/en/gardens',
    '/en/taxa',
    '/en/notifications',
    '/en/settings',
  ]);
});

test('Sidebar: the current destination is aria-current and shows its currentIcon', async () => {
  const screen = await render(DestinationsFixture, { component: 'sidebar' });

  const gardens = screen.getByRole('link', { name: 'Gardens' });
  await expect.element(gardens).toHaveAttribute('aria-current', 'page');
  expect(gardens.getByTestId('filled').elements()).toHaveLength(1);
  const taxa = screen.getByRole('link', { name: 'Taxa' });
  await expect.element(taxa).not.toHaveAttribute('aria-current');
  expect(taxa.getByTestId('outline').elements()).toHaveLength(1);
});

test('Sidebar: a badge joins the name in words', async () => {
  const screen = await render(DestinationsFixture, { component: 'sidebar' });

  await expect
    .element(screen.getByRole('link', { name: 'Notifications 3 new' }))
    .toBeInTheDocument();
});

test('Sidebar: children render after the destinations', async () => {
  const screen = await render(DestinationsFixture, { component: 'sidebar', withChildren: true });

  const links = screen.getByRole('navigation', { name: 'Primary' }).getByRole('link');
  expect(hrefs(links).at(-1)).toBe('/en/extra');
  expect(links.elements()).toHaveLength(5);
});

test('BottomNav: the destinations without compact: false are links in a list', async () => {
  const screen = await render(DestinationsFixture, { component: 'bottom-nav' });

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect.element(nav).toBeInTheDocument();
  expect(nav.getByRole('listitem').elements()).toHaveLength(3);
  expect(hrefs(nav.getByRole('link'))).toEqual(['/en/gardens', '/en/taxa', '/en/notifications']);
});

test('BottomNav: the current item is aria-current and dock-active, with its currentIcon', async () => {
  const screen = await render(DestinationsFixture, { component: 'bottom-nav' });

  const gardens = screen.getByRole('link', { name: 'Gardens' });
  await expect.element(gardens).toHaveAttribute('aria-current', 'page');
  await expect.element(gardens).toHaveClass('dock-active');
  expect(gardens.getByTestId('filled').elements()).toHaveLength(1);
  await expect
    .element(screen.getByRole('link', { name: 'Taxa' }))
    .not.toHaveAttribute('aria-current');
});

test('BottomNav: a badge joins the name in words', async () => {
  const screen = await render(DestinationsFixture, { component: 'bottom-nav' });

  await expect
    .element(screen.getByRole('link', { name: 'Notifications 3 new' }))
    .toBeInTheDocument();
});

test('BottomNav: children render after the destinations', async () => {
  const screen = await render(DestinationsFixture, {
    component: 'bottom-nav',
    withChildren: true,
  });

  const links = screen.getByRole('navigation', { name: 'Primary' }).getByRole('link');
  expect(hrefs(links).at(-1)).toBe('/en/extra');
  expect(links.elements()).toHaveLength(4);
});
