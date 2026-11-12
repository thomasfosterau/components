/**
 * `NavigationRail`: a named navigation landmark of links in a list, hrefs
 * resolved and `aria-current` decided by the context, `currentIcon` on the
 * current destination, a badge named in words, and `labels="current"`
 * keeping every hidden label as its link's name (and a tooltip on focus).
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import NavigationRailFixture from './fixtures/NavigationRailFixture.svelte';

test('is a "Primary" navigation of links in a list, in order', async () => {
  const screen = await render(NavigationRailFixture, {});

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect.element(nav).toBeInTheDocument();
  expect(nav.getByRole('listitem').elements()).toHaveLength(4);
  expect(
    nav
      .getByRole('link')
      .elements()
      .map((link) => link.getAttribute('href')),
  ).toEqual(['/en/inbox', '/en/beds', '/en/plants', '/en/settings']);
});

test('the header sits in the column, outside the landmark', async () => {
  const screen = await render(NavigationRailFixture, {});

  await expect.element(screen.getByRole('button', { name: 'Compose' })).toBeInTheDocument();
  expect(
    screen.getByRole('navigation').getByRole('button', { name: 'Compose' }).elements(),
  ).toHaveLength(0);
  await expect.element(screen.getByTestId('rail')).toHaveClass('w-20');
});

test('the current destination is aria-current and shows its current icon', async () => {
  const screen = await render(NavigationRailFixture, {});

  const inbox = screen.getByRole('link', { name: /^Inbox/ });
  await expect.element(inbox).toHaveAttribute('aria-current', 'page');
  await expect.element(inbox.getByTestId('current-icon')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('link', { name: 'Beds' }))
    .not.toHaveAttribute('aria-current');
  expect(
    screen.getByRole('link', { name: 'Beds' }).getByTestId('current-icon').elements(),
  ).toHaveLength(0);
});

test('a badge joins the name in words; the icon and the visual badge are hidden', async () => {
  const screen = await render(NavigationRailFixture, {});

  await expect.element(screen.getByRole('link', { name: 'Inbox 3 new' })).toBeInTheDocument();
  for (const icon of screen.getByTestId('icon').elements()) {
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
  }
});

test('labels="current": hidden labels stay the names, and show as a tooltip on focus', async () => {
  const screen = await render(NavigationRailFixture, { labels: 'current' });

  // Every destination keeps its accessible name.
  for (const name of ['Inbox 3 new', 'Beds', 'Plants', 'Settings']) {
    await expect.element(screen.getByRole('link', { name })).toBeInTheDocument();
  }
  // The tooltip repeats the name; it does not describe the link.
  const beds = screen.getByRole('link', { name: 'Beds' });
  await expect.element(beds).not.toHaveAttribute('aria-describedby');

  await userEvent.tab();
  await userEvent.tab();
  await userEvent.tab();
  await expect.element(beds).toHaveFocus();
  // The tooltip bubble: "Beds" outside the link itself.
  await expect
    .poll(
      () =>
        page
          .getByText('Beds', { exact: true })
          .elements()
          .filter((element) => element.closest('a') === null).length,
    )
    .toBeGreaterThan(0);
});
