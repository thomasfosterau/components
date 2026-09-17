import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SidebarFixture from './fixtures/SidebarFixture.svelte';

test('the links sit in a named navigation landmark', async () => {
  const screen = await render(SidebarFixture, {});

  await expect.element(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toBeInTheDocument();
});

test('a visible title names the landmark, so the name matches the text', async () => {
  const screen = await render(SidebarFixture, { title: 'Browse' });

  await expect.element(screen.getByRole('navigation', { name: 'Browse' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'Browse' }))
    .toBeInTheDocument();
});

test('an explicit label wins over the title', async () => {
  const screen = await render(SidebarFixture, { title: 'Browse', label: 'Primary navigation' });

  await expect
    .element(screen.getByRole('navigation', { name: 'Primary navigation' }))
    .toBeInTheDocument();
});

test('it is not a complementary landmark — primary navigation is not an aside', async () => {
  const screen = await render(SidebarFixture, { withRegions: true });

  expect(screen.getByRole('complementary').elements()).toHaveLength(0);
});

test('the brand and the account block render in their own regions', async () => {
  const screen = await render(SidebarFixture, { withRegions: true });

  await expect.element(screen.getByTestId('sidebar-brand')).toBeInTheDocument();
  await expect.element(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument();
});

test('the current item marks itself, and Tab alone reaches every link', async () => {
  const screen = await render(SidebarFixture, { currentHref: '/taxa' });

  await expect
    .element(screen.getByRole('link', { name: 'Taxa' }))
    .toHaveAttribute('aria-current', 'page');

  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Taxa' })).toHaveFocus();
});
