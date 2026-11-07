/**
 * `IconButton`'s contract: `label` is the accessible name (the icon is
 * hidden), the tooltip repeats it visually without becoming a description,
 * the hit target is at least 24×24 at every size, a disabled control with a
 * tooltip stays focusable but inert, and `href` makes it a context link.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import IconButton from '../../src/lib/ui/IconButton.svelte';
import IconButtonInContext from './fixtures/IconButtonInContext.svelte';
import { htmlSnippet } from './snippets.ts';

const icon = htmlSnippet(
  '<svg data-testid="glyph" viewBox="0 0 16 16"><path d="M2 2l12 12"/></svg>',
);

test('is a button named by its label, with the icon hidden', async () => {
  const screen = await render(IconButton, { label: 'Close', icon });

  const button = screen.getByRole('button', { name: 'Close' });
  await expect.element(button).toHaveAttribute('type', 'button');
  await expect.element(button).toHaveClass('btn-square');
  await expect.element(button).toHaveClass('btn-ghost');
  expect(screen.getByTestId('glyph').element().closest('[aria-hidden="true"]')).not.toBeNull();
});

test('focus shows the label as a tooltip that repeats the name, not a description', async () => {
  const screen = await render(IconButton, { label: 'Close', icon });

  await userEvent.tab();
  const button = screen.getByRole('button', { name: 'Close' });
  await expect.element(button).toHaveFocus();
  await expect.element(screen.getByText('Close')).toBeVisible();
  await expect.element(button).not.toHaveAttribute('aria-describedby');
  await expect.element(button).toHaveAccessibleName('Close');
});

test('tooltip={false} renders no tooltip', async () => {
  const screen = await render(IconButton, { label: 'Close', icon, tooltip: false });

  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  expect(screen.getByText('Close').elements()).toHaveLength(0);
});

test('the hit target keeps a 24×24 minimum even at size="xs"', async () => {
  // The suite runs without the Tailwind build (vite.config.ts), so a computed
  // box would measure unstyled markup; the classes that set the floor are what
  // can be pinned here. `min-h-6 min-w-6` is 1.5rem: 24px at a 16px root.
  const screen = await render(IconButton, { label: 'Close', icon, size: 'xs' });

  const button = screen.getByRole('button', { name: 'Close' });
  await expect.element(button).toHaveClass('btn-xs');
  await expect.element(button).toHaveClass('min-h-6');
  await expect.element(button).toHaveClass('min-w-6');
});

test('the caller’s handlers run alongside the tooltip’s', async () => {
  const onclick = vi.fn<(event: MouseEvent) => void>();
  const onfocus = vi.fn<(event: FocusEvent) => void>();
  const screen = await render(IconButton, { label: 'Edit', icon, onclick, onfocus });

  await userEvent.tab();
  expect(onfocus).toHaveBeenCalledTimes(1);
  await expect.element(screen.getByText('Edit')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
  expect(onclick).toHaveBeenCalledTimes(1);
});

test('disabled with a tooltip stays focusable, but does not activate', async () => {
  const onclick = vi.fn<(event: MouseEvent) => void>();
  const screen = await render(IconButton, { label: 'Delete', icon, disabled: true, onclick });

  const button = screen.getByRole('button', { name: 'Delete' });
  await expect.element(button).toHaveAttribute('aria-disabled', 'true');
  await expect.element(button).not.toHaveAttribute('disabled');
  await userEvent.tab();
  await expect.element(button).toHaveFocus();
  // Playwright refuses to click an aria-disabled element, which is the point;
  // dispatch the activation a pointer or Enter would.
  const element = button.element();
  if (element instanceof HTMLElement) element.click();
  expect(onclick).not.toHaveBeenCalled();
});

test('disabled without a tooltip is natively disabled', async () => {
  const screen = await render(IconButton, {
    label: 'Delete',
    icon,
    disabled: true,
    tooltip: false,
  });

  await expect.element(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
});

test('href makes it a link resolved through the components context', async () => {
  const screen = await render(IconButtonInContext, { label: 'Edit', href: '/gardens/7/edit' });

  const link = screen.getByRole('link', { name: 'Edit' });
  await expect.element(link).toHaveAttribute('href', '/base/gardens/7/edit');
  await expect.element(link).not.toHaveAttribute('aria-current');
});

test('a link to the current page carries aria-current', async () => {
  const screen = await render(IconButtonInContext, { label: 'Home', href: '/' });

  await expect
    .element(screen.getByRole('link', { name: 'Home' }))
    .toHaveAttribute('aria-current', 'page');
});

/** A type test: `vp run check` fails if `label` ever becomes optional. */
const renderUnnamed = (): unknown =>
  // @ts-expect-error — `label` is missing.
  render(IconButton, { icon });

test('label is required: an icon has no name of its own', () => {
  expect(typeof renderUnnamed).toBe('function');
});
