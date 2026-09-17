import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NavbarFixture from './fixtures/NavbarFixture.svelte';

test('is a banner landmark wrapping a named navigation', async () => {
  const screen = await render(NavbarFixture, { label: 'Main' });

  await expect.element(screen.getByRole('banner')).toBeInTheDocument();
  await expect.element(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  await expect.element(screen.getByTestId('nav-start')).toBeInTheDocument();
});

test('renders only the regions it was given', async () => {
  const screen = await render(NavbarFixture, { withMenu: false });

  expect(screen.getByTestId('nav-center').elements()).toHaveLength(0);
  expect(screen.getByTestId('nav-end').elements()).toHaveLength(0);
  // No panel to disclose, so no toggle.
  expect(screen.getByRole('button', { name: 'Menu' }).elements()).toHaveLength(0);
});

test('renders the centre and end regions when given them', async () => {
  const screen = await render(NavbarFixture, { withRegions: true });

  await expect.element(screen.getByTestId('nav-center')).toBeInTheDocument();
  await expect.element(screen.getByTestId('nav-end')).toBeInTheDocument();
});

test('the toggle names itself and says which region it controls', async () => {
  const screen = await render(NavbarFixture, { menuLabel: 'Open the site menu' });

  const toggle = screen.getByRole('button', { name: 'Open the site menu' });
  await expect.element(toggle).toHaveAttribute('type', 'button');
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');

  const controls = toggle.element().getAttribute('aria-controls');
  expect(controls).toBeTruthy();
  // The reference resolves whether the panel is open or shut.
  expect(document.getElementById(controls ?? '')).not.toBeNull();
});

test('activating the toggle expands the panel and writes the bound state', async () => {
  const screen = await render(NavbarFixture, {});

  const toggle = screen.getByRole('button', { name: 'Menu' });
  const panel = document.getElementById(toggle.element().getAttribute('aria-controls') ?? '');
  expect(panel?.hasAttribute('hidden')).toBe(true);

  await userEvent.click(toggle);

  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByTestId('open')).toHaveTextContent('true');
  await expect.element(screen.getByTestId('nav-menu-link')).toBeVisible();

  await userEvent.click(toggle);
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect.element(screen.getByTestId('open')).toHaveTextContent('false');
});

test('the toggle is reachable and operable from the keyboard alone', async () => {
  const screen = await render(NavbarFixture, {});

  const toggle = screen.getByRole('button', { name: 'Menu' });
  toggle.element().focus();
  await userEvent.keyboard('{Enter}');

  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('an open panel can be driven from the caller', async () => {
  const screen = await render(NavbarFixture, { open: true });

  await expect
    .element(screen.getByRole('button', { name: 'Menu' }))
    .toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByTestId('nav-menu-link')).toBeVisible();
});
