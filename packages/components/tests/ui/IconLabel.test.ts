/**
 * `IconLabel`'s contract: the title is real text in every style — visible,
 * or visually hidden in `icon-only` — so a containing control takes its name
 * from it, and the icon is always `aria-hidden`.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import IconLabel from '../../src/lib/ui/IconLabel.svelte';
import IconLabelInButton from './fixtures/IconLabelInButton.svelte';
import { htmlSnippet } from './snippets.ts';

const icon = htmlSnippet(
  '<svg data-testid="glyph" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>',
);

test('shows the icon and the title, with the icon hidden', async () => {
  const screen = await render(IconLabel, { title: 'Bed 4', icon });

  await expect.element(screen.getByText('Bed 4')).toBeVisible();
  expect(screen.getByTestId('glyph').element().closest('[aria-hidden="true"]')).not.toBeNull();
});

test('icon-only keeps the title as text, so the button it sits in is named by it', async () => {
  const screen = await render(IconLabelInButton, { title: 'Rain', labelStyle: 'icon-only' });

  const button = screen.getByRole('button', { name: 'Rain' });
  await expect.element(button).toBeInTheDocument();
  await expect.element(screen.getByText('Rain')).toHaveClass('sr-only');
});

test('title-only drops the icon', async () => {
  const screen = await render(IconLabel, { title: 'Bed 4', icon, labelStyle: 'title-only' });

  await expect.element(screen.getByText('Bed 4')).toBeVisible();
  expect(screen.getByTestId('glyph').elements()).toHaveLength(0);
});

test('trailingIcon puts the icon after the title', async () => {
  const screen = await render(IconLabel, {
    title: 'Next',
    icon,
    trailingIcon: true,
    'data-testid': 'pair',
  });

  const pair = screen.getByTestId('pair').element();
  expect(pair.lastElementChild?.getAttribute('aria-hidden')).toBe('true');
  expect(pair.firstElementChild?.textContent).toBe('Next');
});
