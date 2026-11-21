/**
 * `MaskedInput`'s editing contract: formatting as typed with earned
 * literals, the caret kept through mid-string edits and deletions across a
 * separator, paste normalised, a wrong-kind keystroke announced, the
 * card preset's brand grouping, blur mode, and the raw value posted.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { maskPresets } from '../../src/lib/fields/mask.ts';
import MaskedInputFixture from './fixtures/MaskedInputFixture.svelte';

const field = (): HTMLInputElement => {
  const node = document.querySelector('input[type="text"]');
  if (!(node instanceof HTMLInputElement)) throw new Error('no input');
  return node;
};

test('formats as typed, keeps the raw value, and leaves the caret at the end', async () => {
  const screen = await render(MaskedInputFixture, {});

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await expect.element(input).toHaveAttribute('inputmode', 'numeric');
  await expect.element(input).toHaveAccessibleDescription('For example, 0412 345 678');
  await input.click();
  await userEvent.keyboard('0412345678');
  await expect.element(input).toHaveValue('0412 345 678');
  await expect.element(screen.getByTestId('raw')).toHaveTextContent('0412345678');
  await expect.element(screen.getByTestId('formatted')).toHaveTextContent('0412 345 678');
  expect(field().selectionStart).toBe(12);
});

test('typing mid-string keeps the caret just after the new digit', async () => {
  const screen = await render(MaskedInputFixture, { value: '04123456' });

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await input.click();
  field().setSelectionRange(6, 6);
  await userEvent.keyboard('9');
  await expect.element(input).toHaveValue('0412 394 56');
  expect(field().selectionStart).toBe(7);
});

test('Backspace just after a separator removes the digit before it', async () => {
  const screen = await render(MaskedInputFixture, { value: '0412345' });

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await input.click();
  field().setSelectionRange(5, 5);
  await userEvent.keyboard('{Backspace}');
  await expect.element(input).toHaveValue('0413 45');
  await expect.element(screen.getByTestId('raw')).toHaveTextContent('041345');
  expect(field().selectionStart).toBe(3);
});

test('a pasted, formatted number is normalised by the preset', async () => {
  const screen = await render(MaskedInputFixture, { mask: maskPresets.auMobile });

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await input.fill('+61 412-345-678');
  await expect.element(input).toHaveValue('0412 345 678');
  await expect.element(input).toHaveAttribute('autocomplete', 'tel-national');
});

test('a letter in a digits mask is announced, and the value is unchanged', async () => {
  const screen = await render(MaskedInputFixture, { value: '04' });

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await input.click();
  await userEvent.keyboard('x');
  await expect.element(input).toHaveValue('04');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Numbers only');
  await userEvent.keyboard('1');
  await expect.element(screen.getByRole('status')).toHaveTextContent('');
});

test('the card preset groups by brand', async () => {
  const screen = await render(MaskedInputFixture, { mask: maskPresets.card });

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await input.click();
  await userEvent.keyboard('378282246310005');
  await expect.element(input).toHaveValue('3782 822463 10005');
});

test('formatOn="blur" leaves the text alone until the field loses focus', async () => {
  const screen = await render(MaskedInputFixture, { formatOn: 'blur' });

  const input = screen.getByRole('textbox', { name: 'Mobile' });
  await input.click();
  await userEvent.keyboard('0412-345678');
  await expect.element(input).toHaveValue('0412-345678');
  await expect.element(screen.getByTestId('raw')).toHaveTextContent('0412345678');
  await userEvent.tab();
  await expect.element(input).toHaveValue('0412 345 678');
});

test('posts the raw value, or the formatted one with submitFormatted', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(MaskedInputFixture, { value: '0412345678', onSubmitted });
  await screen.getByRole('button', { name: 'Save' }).click();
  expect(onSubmitted.mock.calls[0]?.[0].getAll('mobile')).toEqual(['0412345678']);
  await screen.unmount();

  const formatted = await render(MaskedInputFixture, {
    value: '0412345678',
    submitFormatted: true,
    onSubmitted,
  });
  await formatted.getByRole('button', { name: 'Save' }).click();
  expect(onSubmitted.mock.calls[1]?.[0].getAll('mobile')).toEqual(['0412 345 678']);
});
