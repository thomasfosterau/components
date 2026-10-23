import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MenuDropdownFixture from './fixtures/MenuDropdownFixture.svelte';

test('announces the popup on the trigger', async () => {
  const screen = await render(MenuDropdownFixture, {});

  const trigger = screen.getByRole('button', { name: 'Ada Lovelace' });
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  await userEvent.click(trigger);

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByRole('menu', { name: 'Account' })).toBeInTheDocument();
});

test('moves between items with the arrow keys and closes on Escape', async () => {
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
