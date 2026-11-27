/**
 * `Toolbar overflow` and `ButtonGroup overflow` — the hidden controls move
 * into a "More" menu; in a toolbar, "More" is the last arrow-key stop,
 * hidden controls are skipped and the toolbar stays one Tab stop.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ToolbarOverflowFixture from './fixtures/ToolbarOverflowFixture.svelte';
import { instanceOf } from '../dom.ts';

const toolbar = () => page.getByRole('toolbar', { name: 'Actions' });
const more = () => toolbar().getByRole('button', { name: 'More' });

const visibleControls = (): string[] =>
  [...toolbar().element().querySelectorAll<HTMLElement>('[data-overflow-id]')]
    .filter((control) => control.style.display !== 'none')
    .map((control) => control.textContent?.trim() ?? '');

const focus = (name: string): void =>
  instanceOf(page.getByRole('button', { name, exact: true }).element(), HTMLElement).focus();

test('Tab reaches the overflowing toolbar once', async () => {
  await render(ToolbarOverflowFixture, { width: 300 });
  await expect.element(more()).toBeVisible();

  focus('Before');
  await userEvent.tab();
  await expect.element(toolbar().getByRole('button', { name: 'Action 1' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('arrow keys skip the hidden controls and reach "More" last', async () => {
  await render(ToolbarOverflowFixture, { width: 300 });
  await expect.element(more()).toBeVisible();
  const shown = visibleControls();
  expect(shown.length).toBeLessThan(6);

  instanceOf(toolbar().getByRole('button', { name: 'Action 1' }).element(), HTMLElement).focus();
  for (const name of shown.slice(1)) {
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent?.trim()).toBe(name);
  }
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(more()).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(toolbar().getByRole('button', { name: 'Action 1' })).toHaveFocus();
  await userEvent.keyboard('{End}');
  await expect.element(more()).toHaveFocus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(document.activeElement?.textContent?.trim()).toBe(shown.at(-1));
});

test('"More" opens a menu of the hidden controls, which act as the controls do', async () => {
  await render(ToolbarOverflowFixture, { width: 300 });
  await expect.poll(visibleControls).not.toHaveLength(6);
  const hiddenCount = 6 - visibleControls().length;

  await more().click();
  const menu = page.getByRole('menu', { name: 'More' });
  await expect.element(menu).toBeVisible();
  expect(menu.getByRole('menuitem').elements()).toHaveLength(hiddenCount);
  await menu.getByRole('menuitem', { name: 'Action 6' }).click();
  await expect.element(page.getByTestId('pressed')).toHaveTextContent('Action 6');
});

test('a Tab stop that moves into the menu passes to a visible control', async () => {
  const screen = await render(ToolbarOverflowFixture, { width: 600 });
  await expect.poll(visibleControls).toHaveLength(6);

  instanceOf(toolbar().getByRole('button', { name: 'Action 1' }).element(), HTMLElement).focus();
  await userEvent.keyboard('{End}');
  await expect.element(toolbar().getByRole('button', { name: 'Action 6' })).toHaveFocus();

  await screen.rerender({ width: 300 });
  await expect.element(more()).toBeVisible();
  focus('Before');
  await userEvent.tab();
  await expect.element(toolbar().getByRole('button', { name: 'Action 1' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('the toolbar keeps the Tab stop on "More" while anything is hidden, and drops it once nothing is', async () => {
  const screen = await render(ToolbarOverflowFixture, { width: 300 });
  await expect.element(more()).toBeVisible();
  instanceOf(more().element(), HTMLElement).focus();

  focus('Before');
  await userEvent.tab();
  await expect.element(more()).toHaveFocus();

  await screen.rerender({ width: 600 });
  await expect.element(more()).not.toBeInTheDocument();
  focus('Before');
  await userEvent.tab();
  await expect.element(toolbar().getByRole('button', { name: 'Action 1' })).toHaveFocus();
});

test('an overflowing ButtonGroup is a named group whose visible buttons and "More" are each a Tab stop', async () => {
  await render(ToolbarOverflowFixture, { width: 300 });

  const group = page.getByRole('group', { name: 'Save options' });
  const groupMore = group.getByRole('button', { name: 'More' });
  await expect.element(groupMore).toBeVisible();
  const count = group.getByRole('button').elements().length;
  expect(count).toBeLessThan(7);

  instanceOf(group.getByRole('button', { name: 'Action 1' }).element(), HTMLElement).focus();
  for (let i = 1; i < count; i++) await userEvent.tab();
  await expect.element(groupMore).toHaveFocus();
});
