/**
 * `ListGroup` is a settings section: a region named by its heading and
 * described by its description, holding a real list of rows.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SettingsFixture from './fixtures/SettingsFixture.svelte';

test('is a region named by its title, holding a list of its rows', async () => {
  const screen = await render(SettingsFixture);

  const region = screen.getByRole('region', { name: 'Notifications' });
  await expect.element(region).toHaveAccessibleDescription('How we reach you.');
  await expect
    .element(screen.getByRole('heading', { name: 'Notifications', level: 2 }))
    .toBeInTheDocument();
  const list = region.getByRole('list');
  await expect.element(list).toBeInTheDocument();
  expect(list.getByRole('listitem').elements()).toHaveLength(3);
  // The footer is after the list, not in it.
  expect(list.element().textContent).not.toContain('Changes save at once.');
  await expect.element(screen.getByText('Changes save at once.')).toBeInTheDocument();
});
