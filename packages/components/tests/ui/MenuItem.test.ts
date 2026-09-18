import { userEvent } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MenuDropdownFixture from './fixtures/MenuDropdownFixture.svelte';
import MenuNavFixture from './fixtures/MenuNavFixture.svelte';

test('the current page is marked with aria-current, not only a colour', async () => {
  const screen = await render(MenuNavFixture, { currentHref: '/gardens' });

  await expect
    .element(screen.getByRole('link', { name: 'Gardens' }))
    .toHaveAttribute('aria-current', 'page');
  await expect
    .element(screen.getByRole('link', { name: 'Taxa' }))
    .not.toHaveAttribute('aria-current');
});

test('the current item also takes daisyUI’s active class', async () => {
  const screen = await render(MenuNavFixture, { currentHref: '/taxa' });

  await expect.element(screen.getByRole('link', { name: 'Taxa' })).toHaveClass('menu-active');
});

test('a disabled nav item drops its href and says so', async () => {
  const screen = await render(MenuNavFixture, {});

  const item = screen.getByText('Moderation');
  await expect.element(item).toHaveAttribute('aria-disabled', 'true');
  await expect.element(item).not.toHaveAttribute('href');
});

test('a dropdown item with an href stays a real link', async () => {
  const screen = await render(MenuDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));

  // `role="menuitem"` from bits-ui, but still an `<a href>` — middle-click and
  // "open in new tab" have to keep working.
  const item = screen.getByRole('menuitem', { name: 'Your profile' });
  await expect.element(item).toHaveAttribute('href', '/account');
  expect(item.element().tagName).toBe('A');
});

test('a dropdown item without an href is a button that calls onSelect', async () => {
  const onSignOut = vi.fn();
  const screen = await render(MenuDropdownFixture, { onSignOut });

  await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

  expect(onSignOut).toHaveBeenCalledTimes(1);
});

test('a disabled dropdown item is marked disabled for the menu', async () => {
  const screen = await render(MenuDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));

  await expect
    .element(screen.getByRole('menuitem', { name: 'Settings' }))
    .toHaveAttribute('aria-disabled', 'true');
});
