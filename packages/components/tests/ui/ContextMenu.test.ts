import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ContextMenuFixture from './fixtures/ContextMenuFixture.svelte';
import { rightClick } from './right-click.ts';

const MENU = 'Actions for Rosa canina';

test('a right-click on the region opens a labelled menu', async () => {
  const screen = await render(ContextMenuFixture, {});

  await rightClick(screen.getByText('Rosa canina'));

  await expect.element(screen.getByRole('menu', { name: MENU })).toBeInTheDocument();
  await expect.element(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
});

test('the region is focusable, and Shift+F10 opens the menu from the keyboard', async () => {
  const screen = await render(ContextMenuFixture, {});

  const region = screen.getByText('Rosa canina');
  await expect.element(region).toHaveAttribute('tabindex', '0');
  await userEvent.tab();
  await expect.element(region).toHaveFocus();

  await userEvent.keyboard('{Shift>}{F10}{/Shift}');
  await expect.element(screen.getByRole('menu', { name: MENU })).toBeInTheDocument();

  // bits-ui focuses the first item as the menu mounts, so the arrow keys
  // carry on from there.
  await expect.element(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
});

test('the Menu key opens it too', async () => {
  const screen = await render(ContextMenuFixture, {});

  await userEvent.tab();
  await userEvent.keyboard('{ContextMenu}');
  await expect.element(screen.getByRole('menu', { name: MENU })).toBeInTheDocument();
});

test('Escape closes it and focus returns to the region', async () => {
  const screen = await render(ContextMenuFixture, {});

  const region = screen.getByText('Rosa canina');
  await userEvent.tab();
  await userEvent.keyboard('{Shift>}{F10}{/Shift}');
  await expect.element(screen.getByRole('menu', { name: MENU })).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('menu').elements()).toHaveLength(0);
  await expect.element(region).toHaveFocus();
});

test('a menu item calls onSelect, and a link item stays a link', async () => {
  const onRename = vi.fn();
  const screen = await render(ContextMenuFixture, { onRename });

  await rightClick(screen.getByText('Rosa canina'));
  await expect
    .element(screen.getByRole('menuitem', { name: 'Open' }))
    .toHaveAttribute('href', '/taxa/rosa-canina');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));

  expect(onRename).toHaveBeenCalledTimes(1);
});

test('a checkbox item is a menuitemcheckbox that toggles its bound value', async () => {
  const screen = await render(ContextMenuFixture, {});

  await rightClick(screen.getByText('Rosa canina'));
  const pinned = screen.getByRole('menuitemcheckbox', { name: 'Pinned' });
  await expect.element(pinned).toHaveAttribute('aria-checked', 'false');

  await userEvent.click(pinned);

  await expect.element(screen.getByTestId('state')).toHaveTextContent('pinned name');
});

test('radio items are exclusive within their named group', async () => {
  const screen = await render(ContextMenuFixture, {});

  await rightClick(screen.getByText('Rosa canina'));
  await expect.element(screen.getByRole('group', { name: 'Sort by' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('menuitemradio', { name: 'Name' }))
    .toHaveAttribute('aria-checked', 'true');

  await userEvent.click(screen.getByRole('menuitemradio', { name: 'Date added' }));

  await expect.element(screen.getByTestId('state')).toHaveTextContent('unpinned date');
});

test('a submenu opens with the right arrow and closes with the left', async () => {
  const screen = await render(ContextMenuFixture, {});

  await userEvent.tab();
  await userEvent.keyboard('{Shift>}{F10}{/Shift}');
  await userEvent.keyboard('{ArrowDown}{End}');
  const opener = screen.getByRole('menuitem', { name: 'Move to' });
  await expect.element(opener).toHaveFocus();
  await expect.element(opener).toHaveAttribute('aria-haspopup', 'menu');

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('menuitem', { name: 'Bed 1' })).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(opener).toHaveFocus();
});

test('the presentational list does not come between the menu and its items', async () => {
  const screen = await render(ContextMenuFixture, {});

  await rightClick(screen.getByText('Rosa canina'));

  const menu = screen.getByRole('menu', { name: MENU }).element();
  expect(menu.querySelector('ul')?.getAttribute('role')).toBe('none');
  expect(menu.querySelectorAll('li[role="none"]').length).toBeGreaterThan(0);
});

test('disabled opens no menu', async () => {
  const screen = await render(ContextMenuFixture, { disabled: true });

  await rightClick(screen.getByText('Rosa canina'));

  expect(screen.getByRole('menu').elements()).toHaveLength(0);
});
