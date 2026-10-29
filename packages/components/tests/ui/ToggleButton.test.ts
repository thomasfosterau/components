/**
 * `ToggleButton` — `aria-pressed` on bits-ui `Toggle`; the name is constant
 * across states; pressed is more than a colour change.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ToggleButton from '../../src/lib/ui/ToggleButton.svelte';
import { htmlSnippet, textSnippet } from './snippets.ts';

test('a click presses it; the name stays the same', async () => {
  const onPressedChange = vi.fn();
  const screen = await render(ToggleButton, {
    children: textSnippet('Show frost dates'),
    onPressedChange,
  });

  const button = screen.getByRole('button', { name: 'Show frost dates', pressed: false });
  await expect.element(button).toBeInTheDocument();
  await button.click();
  await expect
    .element(screen.getByRole('button', { name: 'Show frost dates', pressed: true }))
    .toHaveAttribute('data-state', 'on');
  expect(onPressedChange).toHaveBeenLastCalledWith(true);
});

test('Space and Enter both toggle', async () => {
  const screen = await render(ToggleButton, { children: textSnippet('Bold') });

  const button = screen.getByRole('button', { name: 'Bold' });
  (button.element() as HTMLButtonElement).focus();
  await userEvent.keyboard(' ');
  await expect.element(button).toHaveAttribute('aria-pressed', 'true');
  await userEvent.keyboard('{Enter}');
  await expect.element(button).toHaveAttribute('aria-pressed', 'false');
});

test('pressed differs from unpressed by more than the tone class', async () => {
  const screen = await render(ToggleButton, { children: textSnippet('Bold'), tone: 'primary' });

  const button = screen.getByRole('button', { name: 'Bold' });
  const off = new Set(button.element().classList);
  await button.click();
  const on = new Set(button.element().classList);
  const changed = [...on].filter((c) => !off.has(c)).concat([...off].filter((c) => !on.has(c)));
  expect(changed).toContain('btn-active');
  expect(changed).toContain('btn-ghost');
  expect(changed.length).toBeGreaterThan(1);
});

test('icon-only: named by label; pressedIcon swaps in while pressed', async () => {
  const screen = await render(ToggleButton, {
    iconOnly: true,
    label: 'Favourite',
    icon: htmlSnippet('<svg data-testid="outline" aria-hidden="true"></svg>'),
    pressedIcon: htmlSnippet('<svg data-testid="filled" aria-hidden="true"></svg>'),
    class: 'ms-2',
  });

  const button = screen.getByRole('button', { name: 'Favourite' });
  await expect.element(screen.getByTestId('outline')).toBeInTheDocument();
  await button.click();
  await expect
    .element(screen.getByRole('button', { name: 'Favourite', pressed: true }))
    .toBeInTheDocument();
  await expect.element(screen.getByTestId('filled')).toBeInTheDocument();
  expect(screen.container.querySelector('[data-testid="outline"]')).toBeNull();
  expect([...button.element().classList].at(-1)).toBe('ms-2');
});

test('tooltip: an icon-only button shows its label on hover', async () => {
  const screen = await render(ToggleButton, {
    iconOnly: true,
    label: 'Mute',
    tooltip: true,
    icon: htmlSnippet('<svg aria-hidden="true"></svg>'),
  });

  const button = screen.getByRole('button', { name: 'Mute' });
  await userEvent.hover(button);
  await expect.element(screen.getByText('Mute', { exact: true }).last()).toBeVisible();
  await expect.element(button).toHaveAccessibleName('Mute');
  await button.click();
  await expect
    .element(screen.getByRole('button', { name: 'Mute', pressed: true }))
    .toBeInTheDocument();
});
