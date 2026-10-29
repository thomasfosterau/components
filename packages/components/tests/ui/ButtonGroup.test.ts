/**
 * `ButtonGroup` — a named group whose buttons each stay a Tab stop.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ToolbarFixture from './fixtures/ToolbarFixture.svelte';

test('a named group; every button is its own Tab stop', async () => {
  const screen = await render(ToolbarFixture, {});

  const group = screen.getByRole('group', { name: 'Save options' });
  await expect.element(group).toHaveClass('join');
  (group.getByRole('button', { name: 'Save', exact: true }).element() as HTMLElement).focus();
  await userEvent.tab();
  await expect.element(group.getByRole('button', { name: 'Save as…' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(group.getByRole('button', { name: 'Discard' })).toHaveFocus();
});
