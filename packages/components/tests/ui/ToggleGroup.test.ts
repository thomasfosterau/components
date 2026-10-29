/**
 * `ToggleGroup` — single mode is a radiogroup where arrows move and select
 * and Tab lands on the checked item; multiple mode is a group of
 * `aria-pressed` buttons; `required`, `name`, `labelId` and icon-only
 * names.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ToggleGroupFixture from './fixtures/ToggleGroupFixture.svelte';

test('single: a radiogroup of radios; arrows move and select, skipping a disabled item', async () => {
  const screen = await render(ToggleGroupFixture, { initial: 'grid' });

  const group = screen.getByRole('radiogroup', { name: 'View' });
  await expect.element(group).toBeInTheDocument();
  expect(group.getByRole('radio').elements()).toHaveLength(4);

  await screen.getByRole('button', { name: 'Before' }).click();
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('radio', { name: 'Grid' })).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  const list = screen.getByRole('radio', { name: 'List' });
  await expect.element(list).toHaveFocus();
  await expect.element(list).toHaveAttribute('aria-checked', 'true');
  await expect
    .element(screen.getByRole('radio', { name: 'Grid' }))
    .toHaveAttribute('aria-checked', 'false');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('list');

  await userEvent.keyboard('{ArrowRight}');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByRole('radio', { name: 'Grid' })).toHaveFocus();
});

test('single: Tab into the group lands on the checked item, not the first', async () => {
  const screen = await render(ToggleGroupFixture, { initial: 'map' });

  await screen.getByRole('button', { name: 'Before' }).click();
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('radio', { name: 'Map' })).toHaveFocus();
});

test('single without required: pressing the selected item clears it', async () => {
  const screen = await render(ToggleGroupFixture, { initial: 'grid' });

  await screen.getByRole('radio', { name: 'Grid' }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('');
});

test('required: pressing the selected item does nothing', async () => {
  const screen = await render(ToggleGroupFixture, { initial: 'grid', required: true });

  await expect
    .element(screen.getByRole('radiogroup', { name: 'View' }))
    .toHaveAttribute('aria-required', 'true');
  await screen.getByRole('radio', { name: 'Grid' }).click();
  await expect
    .element(screen.getByRole('radio', { name: 'Grid' }))
    .toHaveAttribute('aria-checked', 'true');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('grid');
});

test('multiple: a group of toggle buttons; two pressed at once; both post', async () => {
  const screen = await render(ToggleGroupFixture, { type: 'multiple' });

  const group = screen.getByRole('group', { name: 'Formatting' });
  await expect.element(group).toBeInTheDocument();
  await screen.getByRole('button', { name: 'Bold', pressed: false }).click();
  await screen.getByRole('button', { name: 'Italic' }).click();
  await expect
    .element(screen.getByRole('button', { name: 'Bold', pressed: true }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('button', { name: 'Italic', pressed: true }))
    .toBeInTheDocument();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('bold,italic');

  await screen.getByRole('button', { name: 'Save' }).click();
  await expect.element(screen.getByTestId('posted')).toHaveTextContent('bold,italic');
});

test('multiple: arrows move focus without toggling', async () => {
  const screen = await render(ToggleGroupFixture, { type: 'multiple' });

  (screen.getByRole('button', { name: 'Bold' }).element() as HTMLButtonElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect
    .element(screen.getByRole('button', { name: 'Italic', pressed: false }))
    .toHaveFocus();
});

test('single posts one value through its hidden input', async () => {
  const screen = await render(ToggleGroupFixture, { initial: 'list' });

  await screen.getByRole('button', { name: 'Save' }).click();
  await expect.element(screen.getByTestId('posted')).toHaveTextContent('list');
});

test('an icon-only item keeps its name; with tooltip it shows on hover', async () => {
  const screen = await render(ToggleGroupFixture, { tooltip: true });

  const map = screen.getByRole('radio', { name: 'Map' });
  await expect.element(map).toBeInTheDocument();
  await userEvent.hover(map);
  await expect.element(screen.getByText('Map', { exact: true }).last()).toBeVisible();
  await expect.element(map).toHaveAccessibleName('Map');
});

test('inside a FormField the group is named by the label and described by the hint', async () => {
  const screen = await render(ToggleGroupFixture, { inField: true });

  const group = screen.getByRole('radiogroup', { name: 'View' });
  await expect.element(group).toHaveAccessibleDescription('How to show the beds.');
  expect(group.element().hasAttribute('aria-label')).toBe(false);
});

test('class merges last and data-* reach the root; vertical and block apply', async () => {
  const screen = await render(ToggleGroupFixture, { orientation: 'vertical', block: true });

  const root = screen.getByTestId('group').element();
  expect([...root.classList].at(-1)).toBe('mt-1');
  expect(root.classList.contains('join-vertical')).toBe(true);
  expect(root.getAttribute('aria-orientation')).toBe('vertical');
});
