import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MenuChoicesDropdownFixture from './fixtures/MenuChoicesDropdownFixture.svelte';

test('the opener announces a menu, and the right arrow opens it', async () => {
  const screen = await render(MenuChoicesDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'View options' }));
  await userEvent.keyboard('{End}');
  const opener = screen.getByRole('menuitem', { name: 'Group by' });
  await expect.element(opener).toHaveFocus();
  await expect.element(opener).toHaveAttribute('aria-haspopup', 'menu');

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('menuitem', { name: 'Bed' })).toHaveFocus();
});

test('outside a bits-ui menu it renders nothing', async () => {
  const screen = await render(MenuChoicesDropdownFixture, {});

  expect(screen.getByText('Nor a submenu').elements()).toHaveLength(0);
});
