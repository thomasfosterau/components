/**
 * `TreeList` is a native disclosure, not an ARIA `tree`: the browser owns the
 * expanded state, the keyboard and find-in-page, so there is no hand-written
 * `aria-expanded` to drift out of step.
 */

import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TreeListFixture from './fixtures/TreeListFixture.svelte';

test('is nested details/summary inside nested lists', async () => {
  const screen = await render(TreeListFixture);

  const outer = document.querySelector('details');
  expect(outer?.open).toBe(true);
  expect(outer?.querySelector('summary')?.textContent?.trim()).toBe('Rosaceae');
  // Nesting is real nesting, so it is announced as nesting.
  expect(document.querySelectorAll('details')).toHaveLength(2);
  expect(document.querySelectorAll('ul').length).toBeGreaterThan(1);
  await expect.element(screen.getByRole('group').first()).toBeInTheDocument();
});

test('writes no aria-expanded of its own', async () => {
  await render(TreeListFixture);

  expect(document.querySelector('details')?.hasAttribute('aria-expanded')).toBe(false);
  expect(document.querySelector('summary')?.hasAttribute('aria-expanded')).toBe(false);
});

test('unfolds a closed subtree from the keyboard', async () => {
  const screen = await render(TreeListFixture);

  await expect.element(screen.getByText('Rosa canina')).not.toBeVisible();

  await userEvent.tab();
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');

  await expect.element(screen.getByText('Rosa canina')).toBeVisible();
});

test('open is bindable, so a caller can fold the root', async () => {
  const screen = await render(TreeListFixture, { open: false });

  await expect.element(screen.getByText('Fragaria')).not.toBeVisible();
});
