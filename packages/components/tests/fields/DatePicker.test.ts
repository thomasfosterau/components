/**
 * `DatePicker` / `DateRangePicker` — the segmented field plus a labelled
 * calendar button opening a dialog; picking closes it, returns focus and
 * fills the segments; the range halves are named; `minDays` holds.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PickerFixture from './fixtures/PickerFixture.svelte';

test('the field is a group named by the label; the trigger is "Choose date"', async () => {
  const screen = await render(PickerFixture, {});

  const group = screen.getByRole('group', { name: 'Sown on' });
  await expect.element(group).toHaveAccessibleDescription('As on the seed packet.');
  const trigger = group.getByRole('button', { name: 'Choose date' });
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('the trigger opens a dialog with a grid; picking a day closes it, refocuses the trigger and fills the segments', async () => {
  const screen = await render(PickerFixture, {});

  const trigger = screen.getByRole('button', { name: 'Choose date' });
  await trigger.click();
  const dialog = screen.getByRole('dialog', { name: 'Calendar' });
  await expect.element(dialog).toBeVisible();
  await expect.element(dialog.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();

  await dialog.getByRole('button', { name: /14 October 2026/ }).click();
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('2026-10-14');
  await expect
    .element(screen.getByRole('spinbutton', { name: /day/i }))
    .toHaveAttribute('aria-valuenow', '14');

  await screen.getByRole('button', { name: 'Save' }).click();
  await expect.element(screen.getByTestId('posted')).toHaveTextContent('2026-10-14');
});

test('range: one group named by the label, with named start and end halves', async () => {
  const screen = await render(PickerFixture, { range: true });

  const group = screen.getByRole('group', { name: 'Season' });
  await expect.element(group.getByRole('group', { name: 'Start date' })).toBeInTheDocument();
  await expect.element(group.getByRole('group', { name: 'End date' })).toBeInTheDocument();
  await expect
    .element(
      group.getByRole('group', { name: 'End date' }).getByRole('spinbutton', { name: /day/i }),
    )
    .toHaveAccessibleName(/day.*Season.*End date/);
});

test('range: picking a span on the calendar sets both ends and posts both', async () => {
  const screen = await render(PickerFixture, { range: true });

  await screen.getByRole('button', { name: 'Choose date' }).click();
  const dialog = screen.getByRole('dialog', { name: 'Calendar' });
  await dialog.getByRole('button', { name: /\b5 October 2026/ }).click();
  await dialog.getByRole('button', { name: /\b9 October 2026/ }).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('2026-10-05..2026-10-09');

  await screen.getByRole('button', { name: 'Save' }).click();
  await expect.element(screen.getByTestId('posted')).toHaveTextContent('2026-10-05..2026-10-09');
});

test('range: minDays={3} rejects a two-day span', async () => {
  const screen = await render(PickerFixture, { range: true, minDays: 3 });

  await screen.getByRole('button', { name: 'Choose date' }).click();
  const dialog = screen.getByRole('dialog', { name: 'Calendar' });
  await dialog.getByRole('button', { name: /20 October 2026/ }).click();
  // Too-short ends are disabled once a start is chosen, so click through the DOM.
  (dialog.getByRole('button', { name: /21 October 2026/ }).element() as HTMLElement).click();
  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByTestId('bound')).not.toHaveTextContent('2026-10-20..2026-10-21');
});
