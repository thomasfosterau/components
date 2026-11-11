/**
 * `BottomNav`: a named navigation landmark of links named by their labels
 * (and their badge's words, never the icon), the current one marked
 * `aria-current="page"` and `dock-active` from the context, hrefs resolved
 * through the context, and `--bottom-nav-height` published while fixed.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import BottomNavFixture from './fixtures/BottomNavFixture.svelte';

test('is a named navigation of links, in a list', async () => {
  const screen = await render(BottomNavFixture, {});

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect.element(nav).toBeInTheDocument();
  expect(nav.getByRole('listitem').elements()).toHaveLength(3);
  expect(
    nav
      .getByRole('link')
      .elements()
      .map((link) => link.getAttribute('href')),
  ).toEqual(['/en/gardens', '/en/taxa', '/en/notifications']);
});

test('the current item is aria-current and dock-active; the others are not', async () => {
  const screen = await render(BottomNavFixture, {});

  const gardens = screen.getByRole('link', { name: 'Gardens' });
  await expect.element(gardens).toHaveAttribute('aria-current', 'page');
  await expect.element(gardens).toHaveClass('dock-active');
  await expect
    .element(screen.getByRole('link', { name: 'Taxa' }))
    .not.toHaveAttribute('aria-current');
});

test('a badge joins the name in words, and the icon is hidden', async () => {
  const screen = await render(BottomNavFixture, {});

  await expect
    .element(screen.getByRole('link', { name: 'Notifications 3 new' }))
    .toBeInTheDocument();
  for (const icon of screen.getByTestId('icon').elements()) {
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
  }
});

test('fixed, it publishes its height for the page to pad by', async () => {
  const screen = await render(BottomNavFixture, { fixed: true });

  await expect.element(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  await expect
    .poll(() => document.documentElement.style.getPropertyValue('--bottom-nav-height'))
    .toMatch(/^\d+px$/);
  await screen.unmount();
  expect(document.documentElement.style.getPropertyValue('--bottom-nav-height')).toBe('');
});
