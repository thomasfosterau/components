import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MenuChoicesDropdownFixture from './fixtures/MenuChoicesDropdownFixture.svelte';

test('in a DropdownMenu it is a menuitemcheckbox that toggles', async () => {
  const screen = await render(MenuChoicesDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'View options' }));
  const item = screen.getByRole('menuitemcheckbox', { name: 'Show archived' });
  await expect.element(item).toHaveAttribute('aria-checked', 'true');

  await userEvent.click(item);
  await expect.element(screen.getByTestId('view-state')).toHaveTextContent('archived hidden');

  // Reopened, the item reads the bound state back.
  await userEvent.click(screen.getByRole('button', { name: 'View options' }));

  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Show archived' }))
    .toHaveAttribute('aria-checked', 'false');
});

test('outside a bits-ui menu it renders nothing', async () => {
  const screen = await render(MenuChoicesDropdownFixture, {});

  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toBeInTheDocument();
  expect(screen.getByText('Not in a navigation list').elements()).toHaveLength(0);
});
