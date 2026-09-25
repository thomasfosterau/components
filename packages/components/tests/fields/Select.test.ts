import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Select from '../../src/lib/fields/Select.svelte';

const RANKS = [
  { value: 'family', label: 'Family' },
  { value: 'genus', label: 'Genus' },
  { value: 'cultivar', label: 'Cultivar', disabled: true },
];

test('is a native combobox listing its options', async () => {
  const screen = await render(Select, { 'aria-label': 'Rank', options: RANKS, value: 'genus' });

  const select = screen.getByRole('combobox', { name: 'Rank' });
  await expect.element(select).toHaveValue('genus');
  expect(screen.getByRole('option').elements()).toHaveLength(3);
});

test('selecting an option updates the value', async () => {
  const screen = await render(Select, { 'aria-label': 'Rank', options: RANKS, value: 'genus' });

  const select = screen.getByRole('combobox', { name: 'Rank' });
  await userEvent.selectOptions(select, 'family');
  await expect.element(select).toHaveValue('family');
});

test('a disabled option is disabled', async () => {
  const screen = await render(Select, { 'aria-label': 'Rank', options: RANKS });

  await expect.element(screen.getByRole('option', { name: 'Cultivar' })).toBeDisabled();
});

test('the placeholder is a disabled first option, selected while the value is empty', async () => {
  const screen = await render(Select, {
    'aria-label': 'Rank',
    options: RANKS,
    placeholder: 'Choose a rank',
    value: '',
  });

  const placeholder = screen.getByRole('option', { name: 'Choose a rank' });
  await expect.element(placeholder).toBeDisabled();
  await expect.element(screen.getByRole('combobox', { name: 'Rank' })).toHaveValue('');
});

test('bare strings become options whose value is their label', async () => {
  const screen = await render(Select, {
    'aria-label': 'Bed',
    options: ['North', 'South'],
    value: 'South',
  });

  await expect.element(screen.getByRole('combobox', { name: 'Bed' })).toHaveValue('South');
  await expect.element(screen.getByRole('option', { name: 'North' })).toHaveValue('North');
});

test('invalid marks the control and carries the description', async () => {
  const screen = await render(Select, {
    'aria-label': 'Rank',
    options: RANKS,
    invalid: true,
    describedBy: 'rank-error',
  });

  const select = screen.getByRole('combobox', { name: 'Rank' });
  await expect.element(select).toHaveAttribute('aria-invalid', 'true');
  await expect.element(select).toHaveAttribute('aria-describedby', 'rank-error');
  await expect.element(select).toHaveClass('select-error');
});
