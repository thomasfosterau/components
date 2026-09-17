import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MenuDropdownFixture from './fixtures/MenuDropdownFixture.svelte';
import MenuNavFixture from './fixtures/MenuNavFixture.svelte';

test('in nav mode the grouping is a real separator, not a styled line', async () => {
  const screen = await render(MenuNavFixture, {});

  await expect.element(screen.getByRole('separator')).toBeInTheDocument();
});

test('in dropdown mode the separator comes from bits-ui inside a role="none" item', async () => {
  const screen = await render(MenuDropdownFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));

  const separator = screen.getByRole('separator').element();
  expect(separator.parentElement?.getAttribute('role')).toBe('none');
});
