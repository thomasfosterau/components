import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Disclosure from '../../src/lib/ui/Disclosure.svelte';
import DisclosureGroupFixture from './fixtures/DisclosureGroupFixture.svelte';
import { textSnippet } from './snippets.ts';

test('is a native details/summary, with no hand-written ARIA', async () => {
  const screen = await render(Disclosure, {
    title: 'Add an anatomy record',
    children: textSnippet('The form.'),
    'data-testid': 'disclosure',
  });

  const details = screen.getByTestId('disclosure').element();
  expect(details.tagName).toBe('DETAILS');
  expect(details.querySelector('summary')?.textContent?.trim()).toBe('Add an anatomy record');
  // The browser maps `open` to the expanded state; a second hand-written copy
  // could only ever disagree with it.
  expect(details.hasAttribute('aria-expanded')).toBe(false);
  expect(details.querySelector('summary')?.hasAttribute('aria-expanded')).toBe(false);
});

test('opens from the keyboard and reveals its content', async () => {
  const screen = await render(Disclosure, {
    title: 'Add an anatomy record',
    children: textSnippet('The form.'),
  });

  await expect.element(screen.getByText('The form.')).not.toBeVisible();

  await userEvent.tab();
  await userEvent.keyboard('{Enter}');

  await expect.element(screen.getByText('The form.')).toBeVisible();
});

test('open is bindable, so an app can drive the state', async () => {
  const screen = await render(Disclosure, {
    title: 'Add an anatomy record',
    open: true,
    children: textSnippet('The form.'),
  });

  await expect.element(screen.getByText('The form.')).toBeVisible();
});

test('the variant picks the daisyUI marker', async () => {
  const screen = await render(Disclosure, {
    title: 'Chemistry',
    variant: 'plus',
    children: textSnippet('Twelve compounds.'),
    'data-testid': 'disclosure',
  });

  const details = screen.getByTestId('disclosure');
  await expect.element(details).toHaveClass('collapse');
  await expect.element(details).toHaveClass('collapse-plus');
});

test('a shared name makes an exclusive native group: opening one closes the other', async () => {
  const screen = await render(DisclosureGroupFixture, {});

  const [first, second] = screen.container.querySelectorAll('summary');
  first?.click();
  await expect.element(screen.getByText('First body.')).toBeVisible();
  second?.click();
  await expect.element(screen.getByText('Second body.')).toBeVisible();
  await expect.element(screen.getByText('First body.')).not.toBeVisible();
});
