/**
 * `MenuGroup`, and `MenuItem`'s `hotkey` and `tone`: a group named by its
 * heading (or by `aria-label` when the heading is hidden), a shortcut that is
 * announced through `aria-keyshortcuts` rather than joining the item's name,
 * and a destructive tone that is never the only cue.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { isApplePlatform } from '../../src/lib/hotkeys/match.ts';
import MenuGroupFixture from './fixtures/MenuGroupFixture.svelte';

const open = async (screen: Awaited<ReturnType<typeof render>>): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Garden actions' }));
};

test('a dropdown group is named by its heading, or by its label when the heading is hidden', async () => {
  const screen = await render(MenuGroupFixture, {});
  await open(screen);

  const edit = screen.getByRole('group', { name: 'Edit' });
  await expect.element(edit).toBeInTheDocument();
  await expect.element(edit.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
  await expect.element(screen.getByText('Edit', { exact: true })).toBeVisible();

  await expect.element(screen.getByRole('group', { name: 'Danger zone' })).toBeInTheDocument();
  expect(screen.getByText('Danger zone').elements()).toHaveLength(0);
});

test('a hotkey is announced by aria-keyshortcuts and kept out of the name', async () => {
  const screen = await render(MenuGroupFixture, {});
  await open(screen);

  const duplicate = screen.getByRole('menuitem', { name: 'Duplicate', exact: true });
  await expect
    .element(duplicate)
    .toHaveAttribute('aria-keyshortcuts', isApplePlatform() ? 'Meta+D' : 'Control+D');
  await expect
    .element(screen.getByRole('menuitem', { name: 'Help', exact: true }))
    .toHaveAttribute('aria-keyshortcuts', '?');
  // A sequence has no aria-keyshortcuts form; it is shown, not announced.
  await expect
    .element(screen.getByRole('menuitem', { name: 'Go to beds', exact: true }))
    .not.toHaveAttribute('aria-keyshortcuts');
});

test('a destructive item is toned, and still says what it does', async () => {
  const onSelect = vi.fn<(name: string) => void>();
  const screen = await render(MenuGroupFixture, { onSelect });
  await open(screen);

  const remove = screen.getByRole('menuitem', { name: 'Delete garden…' });
  await expect.element(remove).toHaveClass('text-error');
  await userEvent.click(remove);
  expect(onSelect).toHaveBeenCalledWith('delete');
});

test('in a navigation menu, a group is a sub-list named by its title, not a heading', async () => {
  const screen = await render(MenuGroupFixture, {});

  const nav = screen.getByRole('navigation', { name: 'Sections' });
  const records = nav.getByRole('list', { name: 'Records' });
  await expect.element(records.getByRole('link', { name: 'Plants' })).toBeInTheDocument();
  expect(nav.getByRole('heading').elements()).toHaveLength(0);
});
