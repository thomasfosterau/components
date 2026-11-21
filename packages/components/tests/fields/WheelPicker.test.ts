/**
 * `WheelPicker` exposes each column as an APG spinbutton over an
 * `aria-hidden` scroll-snapping list: keys, typeahead, a click on a row and
 * a scroll that settles all commit, and the form posts the value.
 */

import { Time } from '@internationalized/date';
import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import WheelPicker from '../../src/lib/fields/WheelPicker.svelte';
import TimeWheel from '../../src/lib/fields/TimeWheel.svelte';
import type { WheelColumnDef } from '../../src/lib/fields/wheel.ts';

const quantity: WheelColumnDef[] = [
  {
    id: 'amount',
    label: 'Amount',
    options: Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1),
      label: String(index + 1),
    })),
    loop: true,
  },
  {
    id: 'unit',
    label: 'Unit',
    options: [
      { value: 'g', label: 'grams' },
      { value: 'kg', label: 'kilograms' },
      { value: 't', label: 'tonnes', disabled: true },
      { value: 'lb', label: 'pounds' },
    ],
  },
];

test('is a named group of spinbuttons, valued by option label', async () => {
  await render(WheelPicker, { columns: quantity, label: 'Harvest', value: { amount: '3' } });
  const group = page.getByRole('group', { name: 'Harvest' });
  await expect.element(group).toBeVisible();
  const amount = group.getByRole('spinbutton', { name: 'Amount' });
  await expect.element(amount).toHaveAttribute('aria-valuetext', '3');
  await expect.element(amount).toHaveAttribute('aria-valuenow', '3');
  await expect.element(amount).toHaveAttribute('aria-valuemax', '12');
  const unit = group.getByRole('spinbutton', { name: 'Unit' });
  await expect.element(unit).toHaveAttribute('aria-valuetext', 'grams');
  expect(unit.element().hasAttribute('aria-valuenow')).toBe(false);
});

test('arrow keys step, skip disabled options, wrap with loop, and Home/End jump', async () => {
  const onValueChange = vi.fn<(value: Record<string, string>) => void>();
  await render(WheelPicker, { columns: quantity, label: 'Harvest', onValueChange });
  const unit = page.getByRole('spinbutton', { name: 'Unit' });
  await userEvent.click(unit);
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  await expect.element(unit).toHaveAttribute('aria-valuetext', 'pounds');
  expect(onValueChange).toHaveBeenLastCalledWith({ amount: '1', unit: 'lb' });
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(unit).toHaveAttribute('aria-valuetext', 'pounds');
  await userEvent.keyboard('{Home}');
  await expect.element(unit).toHaveAttribute('aria-valuetext', 'grams');

  const amount = page.getByRole('spinbutton', { name: 'Amount' });
  await userEvent.click(amount);
  await userEvent.keyboard('{End}{ArrowDown}');
  await expect.element(amount).toHaveAttribute('aria-valuetext', '1');
  await userEvent.keyboard('{PageDown}');
  await expect.element(amount).toHaveAttribute('aria-valuetext', '6');
});

test('typing jumps to the next option starting with the text', async () => {
  await render(WheelPicker, { columns: quantity, label: 'Harvest' });
  const amount = page.getByRole('spinbutton', { name: 'Amount' });
  await userEvent.click(amount);
  await userEvent.keyboard('1');
  await expect.element(amount).toHaveAttribute('aria-valuetext', '10');
  await userEvent.keyboard('1');
  await expect.element(amount).toHaveAttribute('aria-valuetext', '11');
});

test('a scroll that settles commits the centred row; a click on a row selects it', async () => {
  await render(WheelPicker, { columns: quantity, label: 'Harvest' });
  const amount = page.getByRole('spinbutton', { name: 'Amount' });
  const list = amount.element().querySelector<HTMLElement>('[aria-hidden="true"]');
  const row = list?.querySelector<HTMLElement>('[data-index]')?.offsetHeight ?? 0;
  expect(row).toBeGreaterThan(0);
  list?.scrollTo({ top: row * 4 });
  list?.dispatchEvent(new Event('scrollend'));
  await expect.element(amount).toHaveAttribute('aria-valuetext', '5');

  const unit = page.getByRole('spinbutton', { name: 'Unit' });
  const kilograms = unit.element().querySelector<HTMLElement>('[data-index="1"]');
  kilograms?.click();
  await expect.element(unit).toHaveAttribute('aria-valuetext', 'kilograms');
});

test('a scroll settling on a disabled row moves to the nearest enabled one', async () => {
  await render(WheelPicker, { columns: quantity, label: 'Harvest' });
  const unit = page.getByRole('spinbutton', { name: 'Unit' });
  const list = unit.element().querySelector<HTMLElement>('[aria-hidden="true"]');
  const row = list?.querySelector<HTMLElement>('[data-index]')?.offsetHeight ?? 0;
  list?.scrollTo({ top: row * 2 });
  list?.dispatchEvent(new Event('scrollend'));
  await expect.element(unit).toHaveAttribute('aria-valuetext', 'kilograms');
});

test('posts each column under name[id], or the serialised value', async () => {
  const { container } = await render(WheelPicker, {
    columns: quantity,
    label: 'Harvest',
    name: 'harvest',
    value: { amount: '2', unit: 'kg' },
  });
  const inputs = [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
  expect(inputs.map((input) => `${input.name}=${input.value}`)).toEqual([
    'harvest[amount]=2',
    'harvest[unit]=kg',
  ]);
});

test('TimeWheel follows the locale clock and posts an ISO time', async () => {
  const { container } = await render(TimeWheel, {
    label: 'Start time',
    locales: 'en-US',
    minuteStep: 5,
    name: 'start',
    value: new Time(14, 30),
  });
  const group = page.getByRole('group', { name: 'Start time' });
  await expect
    .element(group.getByRole('spinbutton', { name: 'Hours' }))
    .toHaveAttribute('aria-valuetext', '2');
  await expect
    .element(group.getByRole('spinbutton', { name: 'AM/PM' }))
    .toHaveAttribute('aria-valuetext', 'PM');
  const minutes = group.getByRole('spinbutton', { name: 'Minutes' });
  await userEvent.click(minutes);
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(minutes).toHaveAttribute('aria-valuetext', '35');
  expect(container.querySelector<HTMLInputElement>('input[name="start"]')?.value).toBe('14:35:00');
});
