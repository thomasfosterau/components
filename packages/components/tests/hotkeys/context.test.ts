/**
 * The context plumbing: `createHotkeyRegistry` (the provider),
 * `getHotkeyRegistry` (the consumer, including the no-provider throw) and the
 * declarative `registerHotkeys` helper.
 *
 * These go through real component fixtures because `setContext` /
 * `getContext` and the `$effect` inside `registerHotkeys` only work during a
 * component's lifecycle — a plain function call from a `.test.ts` would throw
 * `lifecycle_outside_component`. The provider fixture mounts the registry and
 * a child consumer; the child mirrors the registry's role-filtered `active`
 * ids into the DOM, so the assertion covers the whole
 * provider → context → consumer round-trip.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import HotkeyNoProviderFixture from './fixtures/HotkeyNoProviderFixture.svelte';
import HotkeyProviderFixture from './fixtures/HotkeyProviderFixture.svelte';

/** Active ids the consumer rendered, in match-precedence order. */
const activeIds = (screen: Awaited<ReturnType<typeof render>>): string[] =>
  screen
    .getByTestId('active-id')
    .elements()
    .map((element) => element.textContent ?? '');

test('the registry the consumer resolves is the instance the provider created', async () => {
  const screen = await render(HotkeyProviderFixture, { isAdmin: true });

  await expect.element(screen.getByTestId('same-instance')).toHaveTextContent('true');
});

test('getHotkeyRegistry throws a helpful error when nothing created one', async () => {
  let thrown: unknown;
  try {
    await render(HotkeyNoProviderFixture);
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(Error);
  expect((thrown as Error).name).toBe('HotkeyRegistryMissing');
  expect((thrown as Error).message).toMatch(/HotkeyRegistry not found in context/);
});

test('registerHotkeys contributes the calling component’s actions, page scope first', async () => {
  const screen = await render(HotkeyProviderFixture, { isAdmin: true });

  await expect.element(screen.getByTestId('active')).toHaveTextContent('page.action');
  expect(activeIds(screen)).toEqual(['page.action', 'global.action']);
});

test('an admin-only registered action is dropped for a non-admin viewer', async () => {
  const screen = await render(HotkeyProviderFixture, { isAdmin: false, withAdminAction: true });

  await expect.element(screen.getByTestId('active')).toHaveTextContent('page.action');
  expect(activeIds(screen)).toEqual(['page.action', 'global.action']);
});

test('an admin-only registered action is kept for an admin viewer', async () => {
  const screen = await render(HotkeyProviderFixture, { isAdmin: true, withAdminAction: true });

  await expect.element(screen.getByTestId('active')).toHaveTextContent('page.admin');
  expect(activeIds(screen)).toContain('page.admin');
});
