import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MenuNavFixture from './fixtures/MenuNavFixture.svelte';

test('a Menu is a labelled navigation landmark around a list of links', async () => {
  const screen = await render(MenuNavFixture, { label: 'Primary' });

  const nav = screen.getByRole('navigation', { name: 'Primary' });
  await expect.element(nav).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toBeInTheDocument();
});

test('a context member forwarded as `undefined` falls back to its default (#76)', async () => {
  // The fixture forwards its omitted `href` resolver as an explicit
  // `undefined`; the default resolver is the identity.
  const screen = await render(MenuNavFixture, {});

  await expect
    .element(screen.getByRole('link', { name: 'Gardens' }))
    .toHaveAttribute('href', '/gardens');
});

test('a forwarded context member is used', async () => {
  const screen = await render(MenuNavFixture, { href: (path: string) => `/en${path}` });

  await expect
    .element(screen.getByRole('link', { name: 'Gardens' }))
    .toHaveAttribute('href', '/en/gardens');
});

test('a Menu is reachable with Tab alone — no widget, no roving focus', async () => {
  const screen = await render(MenuNavFixture, {});

  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Gardens' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Taxa' })).toHaveFocus();
});
