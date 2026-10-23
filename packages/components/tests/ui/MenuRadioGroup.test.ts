import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MenuChoicesDropdownFixture from './fixtures/MenuChoicesDropdownFixture.svelte';

test('a group named by its heading, its radio items exclusive', async () => {
  const screen = await render(MenuChoicesDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'View options' }));
  await expect.element(screen.getByRole('group', { name: 'Density' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('menuitemradio', { name: 'Comfortable' }))
    .toHaveAttribute('aria-checked', 'true');

  await userEvent.click(screen.getByRole('menuitemradio', { name: 'Compact' }));
  await userEvent.click(screen.getByRole('button', { name: 'View options' }));

  await expect
    .element(screen.getByRole('menuitemradio', { name: 'Compact' }))
    .toHaveAttribute('aria-checked', 'true');
  await expect
    .element(screen.getByRole('menuitemradio', { name: 'Comfortable' }))
    .toHaveAttribute('aria-checked', 'false');
});
