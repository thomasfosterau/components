import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MenuDropdownFixture from './fixtures/MenuDropdownFixture.svelte';
import MenuNavFixture from './fixtures/MenuNavFixture.svelte';

test('nav mode is a labelled navigation landmark around a list of links', async () => {
  const screen = await render(MenuNavFixture, { label: 'Primary' });

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect.element(nav).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toBeInTheDocument();
});

test('a context member forwarded as `undefined` falls back to its default (#76)', async () => {
  // The fixture forwards its omitted `href` resolver as an explicit
  // `undefined`; the default resolver is the identity.
  const screen = await render(MenuNavFixture, {});

  await expect
    .element(screen.getByRole('link', { name: 'Gardens' }))
    .toHaveAttribute('href', '/gardens');
});

test('a forwarded context member is used', async () => {
  const screen = await render(MenuNavFixture, { href: (path: string) => `/en${path}` });

  await expect
    .element(screen.getByRole('link', { name: 'Gardens' }))
    .toHaveAttribute('href', '/en/gardens');
});

test('nav mode is reachable with Tab alone — no widget, no roving focus', async () => {
  const screen = await render(MenuNavFixture, {});

  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Taxa' })).toHaveFocus();
});

test('dropdown mode announces the popup on the trigger', async () => {
  const screen = await render(MenuDropdownFixture, {});

  const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(trigger);

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByRole('menu', { name: 'Account' })).toBeInTheDocument();
});

test('dropdown mode moves between items with the arrow keys and closes on Escape', async () => {
  const screen = await render(MenuDropdownFixture, {});

  const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
  await userEvent.click(trigger);

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('menuitem', { name: 'Your profile' })).toHaveFocus();

  // `Settings` is disabled, so the arrow key skips it entirely.
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();

  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('menu').elements()).toHaveLength(0);
  await expect.element(trigger).toHaveFocus();
});

test('the presentational list does not come between the menu and its items', async () => {
  const screen = await render(MenuDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));

  // `role="none"` on the `<ul>`/`<li>` styling wrappers, so `role="menu"`
  // still owns its `role="menuitem"` children in the accessibility tree.
  const menu = screen.getByRole('menu').element();
  expect(menu.querySelector('ul')?.getAttribute('role')).toBe('none');
  expect(menu.querySelectorAll('li[role="none"]').length).toBeGreaterThan(0);
});
