/**
 * `Toolbar` — one Tab stop, arrow keys across every control (buttons,
 * toggle sets, links), named controls and context-resolved links.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ToolbarFixture from './fixtures/ToolbarFixture.svelte';

test('a named toolbar that is one Tab stop', async () => {
  const screen = await render(ToolbarFixture, {});

  await expect
    .element(screen.getByRole('toolbar', { name: 'Formatting' }))
    .toHaveAttribute('aria-orientation', 'horizontal');
  await screen.getByRole('button', { name: 'Before' }).click();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('→ moves across buttons, into the toggle sets and on to the link', async () => {
  const screen = await render(ToolbarFixture, {});

  (screen.getByRole('button', { name: 'Undo' }).element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  await expect.element(screen.getByRole('radio', { name: 'Left' })).toHaveFocus();
  await userEvent.keyboard('{End}');
  await expect.element(screen.getByRole('link', { name: 'Help' })).toHaveFocus();
});

test('vertical: ↓ moves, → does not', async () => {
  const screen = await render(ToolbarFixture, { orientation: 'vertical' });

  (screen.getByRole('button', { name: 'Undo' }).element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
});

test('toggle sets: a named group of pressed buttons, and a required radiogroup', async () => {
  const screen = await render(ToolbarFixture, {});

  const styles = screen.getByRole('group', { name: 'Text style' });
  await styles.getByRole('button', { name: 'Bold', pressed: false }).click();
  await expect
    .element(styles.getByRole('button', { name: 'Bold', pressed: true }))
    .toBeInTheDocument();

  const align = screen.getByRole('radiogroup', { name: 'Alignment' });
  await align.getByRole('radio', { name: 'Left' }).click();
  await expect
    .element(align.getByRole('radio', { name: 'Left' }))
    .toHaveAttribute('aria-checked', 'true');
  await align.getByRole('radio', { name: 'Centre' }).click();
  await expect.element(screen.getByTestId('state')).toHaveTextContent('bold|centre');
});

test('the separator runs across the toolbar; the link resolves through href()', async () => {
  const screen = await render(ToolbarFixture, {});

  await expect
    .element(screen.getByRole('separator'))
    .toHaveAttribute('aria-orientation', 'vertical');
  await expect
    .element(screen.getByRole('link', { name: 'Help' }))
    .toHaveAttribute('href', '/app/help');
});
