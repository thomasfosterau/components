/**
 * `ListRow`'s contract is the name: a link or button row is one target named
 * by its headline (and value), and a control row's control is named by the
 * row's headline, so a visually labelled switch is never an unnamed one.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import ListRow from '../../src/lib/data/ListRow.svelte';
import NestedTrailingFixture from './fixtures/NestedTrailingFixture.svelte';
import SettingsFixture from './fixtures/SettingsFixture.svelte';

const digests = (): string => document.querySelector('[data-testid="digests"]')?.textContent ?? '';

test('a control row names its control after the headline and describes it with the supporting text', async () => {
  const screen = await render(SettingsFixture);

  const toggle = screen.getByRole('switch', { name: 'Email digests' });
  await expect.element(toggle).toHaveAccessibleDescription('A summary every Monday.');
  await expect.element(toggle).not.toBeChecked();

  // The whole row's text is the hit target.
  await screen.getByText('Email digests').click();
  await expect.element(toggle).toBeChecked();
  expect(digests()).toBe('on');
  await screen.getByText('A summary every Monday.').click();
  await expect.element(toggle).not.toBeChecked();
});

test('a link row is one link named by its headline and value, with a description', async () => {
  const screen = await render(SettingsFixture);

  const link = screen.getByRole('link', { name: 'Units Metric' });
  await expect.element(link).toHaveAttribute('href', '/settings/units');
  await expect.element(link).toHaveAccessibleDescription('How distances read.');
  await expect.element(link).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('link').elements()).toHaveLength(1);
});

test('a link row is marked current when the context says so', async () => {
  const screen = await render(SettingsFixture, { current: '/settings/units' });

  await expect
    .element(screen.getByRole('link', { name: 'Units Metric' }))
    .toHaveAttribute('aria-current', 'page');
});

test('a button row acts, and a disabled one does not', async () => {
  const onDelete = vi.fn<() => void>();
  const screen = await render(SettingsFixture, { onDelete });

  const button = screen.getByRole('button', { name: 'Delete account' });
  await expect.element(button).toHaveClass('text-error');
  await userEvent.click(button);
  expect(onDelete).toHaveBeenCalledOnce();

  await screen.rerender({ onDelete, disabled: true });
  await expect.element(button).toHaveAttribute('aria-disabled', 'true');
  // Still focusable and clickable, as `aria-disabled` leaves it; it just does
  // nothing. (Playwright refuses to click an aria-disabled element, so the
  // click is the DOM's.)
  const element = button.element();
  if (element instanceof HTMLElement) element.click();
  expect(onDelete).toHaveBeenCalledOnce();
});

test('outside a group a row is just its body, with no list item', async () => {
  const screen = await render(ListRow, {
    headline: 'Basil',
    supporting: 'Herb',
    'data-testid': 'row',
  });

  await expect.element(screen.getByTestId('row')).toBeInTheDocument();
  expect(document.querySelector('li')).toBeNull();
  expect(screen.getByRole('link').elements()).toHaveLength(0);
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('warns when a link row holds a focusable trailing element', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await render(NestedTrailingFixture);

  await expect.poll(() => warn.mock.calls.length).toBeGreaterThan(0);
  expect(String(warn.mock.calls[0]?.[0])).toContain('[ListRow]');
  warn.mockRestore();
});
