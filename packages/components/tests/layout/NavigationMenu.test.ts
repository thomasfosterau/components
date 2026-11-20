import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import NavigationMenu from '../../src/lib/layout/NavigationMenu.svelte';
import NavigationMenuFixture from './fixtures/NavigationMenuFixture.svelte';

afterEach(async () => {
  await page.viewport(1280, 800);
});

test('inside Navbar: closed triggers in the named nav, and no menu role', async () => {
  await page.viewport(1280, 800);
  const screen = await render(NavigationMenuFixture);

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect
    .element(nav.getByRole('button', { name: 'Plants', expanded: false }))
    .toBeInTheDocument();
  expect(screen.getByRole('navigation').elements()).toHaveLength(1);
  expect(document.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
  await expect
    .element(nav.getByRole('link', { name: 'About' }))
    .toHaveAttribute('href', '/app/about');
});

test('a click opens the panel, and Tab goes from the trigger into it', async () => {
  await page.viewport(1280, 800);
  const screen = await render(NavigationMenuFixture);
  const plants = screen.getByRole('button', { name: 'Plants' });

  await plants.click();

  await expect.element(plants).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByRole('link', { name: /Shrubs/ })).toBeVisible();
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: /Trees/ })).toHaveFocus();
  await expect
    .element(screen.getByRole('link', { name: /Trees/ }))
    .toHaveAttribute('href', '/app/plants/trees');
});

test('a closed panel keeps its links out of the Tab order', async () => {
  await page.viewport(1280, 800);
  const screen = await render(NavigationMenuFixture);

  screen.getByRole('button', { name: 'Plants' }).element().focus();
  await userEvent.tab();

  await expect.element(screen.getByRole('button', { name: 'Guides' })).toHaveFocus();
});

test('Escape closes the panel and focuses its trigger', async () => {
  await page.viewport(1280, 800);
  const screen = await render(NavigationMenuFixture);
  const plants = screen.getByRole('button', { name: 'Plants' });

  await plants.click();
  await userEvent.tab();
  await userEvent.keyboard('{Escape}');

  await expect.element(plants).toHaveAttribute('aria-expanded', 'false');
  await expect.element(plants).toHaveFocus();
});

test('the current page is aria-current="page", and its section trigger "true"', async () => {
  await page.viewport(1280, 800);
  const screen = await render(NavigationMenuFixture, { currentHref: '/plants/shrubs' });

  await expect
    .element(screen.getByRole('button', { name: 'Plants' }))
    .toHaveAttribute('aria-current', 'true');
  await expect
    .element(screen.getByRole('button', { name: 'Guides' }))
    .not.toHaveAttribute('aria-current');
  await screen.getByRole('button', { name: 'Plants' }).click();
  await expect
    .element(screen.getByRole('link', { name: 'Shrubs' }))
    .toHaveAttribute('aria-current', 'page');
});

test('vertical is a disclosure per section, usable on a phone', async () => {
  await page.viewport(375, 812);
  const screen = await render(NavigationMenu, {
    label: 'Sections',
    orientation: 'vertical',
    sections: [
      { label: 'Plants', links: [{ label: 'Trees', href: '/plants/trees' }] },
      { label: 'About', href: '/about' },
    ],
  });

  const nav = screen.getByRole('navigation', { name: 'Sections' });
  const details = nav.element().querySelector('details');
  expect(details?.open).toBe(false);
  await nav.getByText('Plants').click();
  await expect.element(nav.getByRole('link', { name: 'Trees' })).toBeVisible();
  await expect.element(nav.getByRole('link', { name: 'About' })).toBeVisible();
});
